import SwiftUI
import AppKit
import EventKit
import ServiceManagement

@main
struct BanpetMacApp: App {
    @StateObject private var model = WorkdayModel()

    var body: some Scene {
        MenuBarExtra(model.menuTitle) {
            BanpetMenu(model: model)
        }
        .menuBarExtraStyle(.window)

        Settings {
            SettingsView(model: model)
        }
    }
}

@MainActor
final class WorkdayModel: ObservableObject {
    @AppStorage("monthlySalary") var monthlySalary = 5000.0
    @AppStorage("currency") var currency = "USD"
    @AppStorage("startHour") var startHour = 9
    @AppStorage("endHour") var endHour = 18
    @AppStorage("workDays") var workDays = 21.75
    @AppStorage("pet") var pet = "🐈"
    @AppStorage("calendarEnabled") var calendarEnabled = false
    @Published var now = Date()
    @Published var meetingMinutes = 0
    @Published var calendarStatus = "未连接 Calendar"

    private let store = EKEventStore()
    private var timer: Timer?

    init() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick() }
        }
        tick()
    }

    var symbol: String {
        ["USD":"$", "CNY":"¥", "EUR":"€", "GBP":"£", "JPY":"¥", "CAD":"C$", "AUD":"A$"][currency] ?? "$"
    }

    var hourlyRate: Double {
        monthlySalary / max(workDays, 1) / Double(max(endHour - startHour, 1))
    }

    var earnedToday: Double {
        let calendar = Calendar.current
        let start = calendar.date(bySettingHour: startHour, minute: 0, second: 0, of: now)!
        let end = calendar.date(bySettingHour: endHour, minute: 0, second: 0, of: now)!
        let elapsed = min(max(now.timeIntervalSince(start), 0), end.timeIntervalSince(start))
        return hourlyRate * elapsed / 3600
    }

    var secondsToLeave: Int {
        let end = Calendar.current.date(bySettingHour: endHour, minute: 0, second: 0, of: now)!
        return max(0, Int(end.timeIntervalSince(now)))
    }

    var countdown: String {
        String(format: "%02d:%02d:%02d", secondsToLeave / 3600, secondsToLeave % 3600 / 60, secondsToLeave % 60)
    }

    var menuTitle: String { "\(pet) \(symbol)\(earnedToday.formatted(.number.precision(.fractionLength(2)))) · \(countdown)" }
    var meetingEarnings: Double { hourlyRate * Double(meetingMinutes) / 60 }

    func tick() {
        now = Date()
        if calendarEnabled && Calendar.current.component(.second, from: now) == 0 { refreshCalendar() }
    }

    func requestCalendar() async {
        do {
            let granted = try await store.requestFullAccessToEvents()
            calendarEnabled = granted
            calendarStatus = granted ? "Calendar 已连接，仅统计会议时长" : "Calendar 权限未授予"
            if granted { refreshCalendar() }
        } catch {
            calendarEnabled = false
            calendarStatus = "Calendar 连接失败"
        }
    }

    func refreshCalendar() {
        guard calendarEnabled else { return }
        let cal = Calendar.current
        let start = cal.startOfDay(for: now)
        let end = cal.date(byAdding: .day, value: 1, to: start)!
        let predicate = store.predicateForEvents(withStart: start, end: end, calendars: nil)
        let events = store.events(matching: predicate).filter { !$0.isAllDay && $0.status != .canceled }
        meetingMinutes = events.reduce(0) { $0 + max(0, Int($1.endDate.timeIntervalSince($1.startDate) / 60)) }
        calendarStatus = "今日 \(events.count) 场会议 · 不保存标题"
    }

    func launchAtLogin(_ enabled: Bool) {
        do {
            if enabled { try SMAppService.mainApp.register() } else { try SMAppService.mainApp.unregister() }
        } catch { }
    }
}

struct BanpetMenu: View {
    @ObservedObject var model: WorkdayModel
    @Environment(\.openSettings) private var openSettings

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text(model.pet).font(.system(size: 54))
                VStack(alignment: .leading) {
                    Text("今天已从公司拿回").font(.caption).bold()
                    Text("\(model.symbol)\(model.earnedToday.formatted(.number.precision(.fractionLength(2))))")
                        .font(.system(size: 28, weight: .semibold, design: .serif))
                }
            }
            Divider()
            HStack {
                metric("距离下班", model.countdown)
                Spacer()
                metric("会议收入", "\(model.symbol)\(model.meetingEarnings.formatted(.number.precision(.fractionLength(2))))")
            }
            Text(model.calendarStatus).font(.caption).foregroundStyle(.secondary)
            HStack {
                Button("设置") { openSettings() }
                Spacer()
                Button("退出班宠") { NSApplication.shared.terminate(nil) }
            }
        }
        .padding(18)
        .frame(width: 330)
    }

    private func metric(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) { Text(title).font(.caption); Text(value).font(.system(.body, design: .monospaced)).bold() }
    }
}

struct SettingsView: View {
    @ObservedObject var model: WorkdayModel
    @State private var launchAtLogin = false

    var body: some View {
        Form {
            Picker("班宠", selection: $model.pet) { ForEach(["🐟","🐈","🦫","👻","🐲","🐙"], id: \.self) { Text($0) } }
            Picker("货币", selection: $model.currency) { ForEach(["USD","CNY","EUR","GBP","JPY","CAD","AUD"], id: \.self) { Text($0) } }
            TextField("月薪", value: $model.monthlySalary, format: .number)
            Stepper("上班：\(model.startHour):00", value: $model.startHour, in: 0...23)
            Stepper("下班：\(model.endHour):00", value: $model.endHour, in: 1...24)
            TextField("每月工作日", value: $model.workDays, format: .number)
            Toggle("登录时自动启动", isOn: $launchAtLogin).onChange(of: launchAtLogin) { _, value in model.launchAtLogin(value) }
            HStack {
                Text(model.calendarStatus)
                Spacer()
                Button("连接 Calendar") { Task { await model.requestCalendar() } }
            }
            Text("工资与会议统计只存在这台 Mac。Calendar 事件标题不会保存。")
                .font(.caption).foregroundStyle(.secondary)
        }
        .formStyle(.grouped)
        .padding()
        .frame(width: 470, height: 390)
    }
}
