import SwiftUI
import AppKit
import EventKit
import ServiceManagement
import UserNotifications

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
    @AppStorage("dailyDate") var dailyDate = ""
    @AppStorage("focusSeconds") var storedFocusSeconds = 0.0
    @AppStorage("flowCount") var flowCount = 0
    @AppStorage("workSkillCount") var workSkillCount = 0
    @AppStorage("lifeSkillCount") var lifeSkillCount = 0
    @AppStorage("maskCount") var maskCount = 0
    @AppStorage("joyCount") var joyCount = 0
    @AppStorage("coffeeCount") var coffeeCount = 0
    @AppStorage("sarcasmCount") var sarcasmCount = 0
    @AppStorage("dadCount") var dadCount = 0
    @AppStorage("toiletSeconds") var storedToiletSeconds = 0.0
    @AppStorage("arrivalTimestamp") var arrivalTimestamp = 0.0
    @AppStorage("notificationsEnabled") var notificationsEnabled = false
    @AppStorage("autoBackupPath") var autoBackupPath = ""
    @Published var now = Date()
    @Published var meetingMinutes = 0
    @Published var calendarStatus = "未连接 Calendar"
    @Published var focusStartedAt: Date?
    @Published var toiletStartedAt: Date?

    private let store = EKEventStore()
    private var timer: Timer?

    init() {
        resetDailyIfNeeded()
        if arrivalTimestamp == 0 { arrivalTimestamp = Date().timeIntervalSince1970 }
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
        resetDailyIfNeeded()
        if calendarEnabled && Calendar.current.component(.second, from: now) == 0 { refreshCalendar() }
    }

    private var todayKey: String { Date.now.formatted(.iso8601.year().month().day()) }
    private func resetDailyIfNeeded() {
        guard dailyDate != todayKey else { return }
        dailyDate = todayKey; storedFocusSeconds = 0; focusStartedAt = nil
        flowCount = 0; workSkillCount = 0; lifeSkillCount = 0; maskCount = 0; joyCount = 0
        coffeeCount = 0; sarcasmCount = 0; dadCount = 0; storedToiletSeconds = 0; toiletStartedAt = nil; arrivalTimestamp = Date().timeIntervalSince1970
    }
    var focusSeconds: Double { storedFocusSeconds + (focusStartedAt.map { max(0, now.timeIntervalSince($0)) } ?? 0) }
    var focusLabel: String { String(format: "%02d:%02d:%02d", Int(focusSeconds) / 3600, Int(focusSeconds) % 3600 / 60, Int(focusSeconds) % 60) }
    func toggleFocus() { if let start = focusStartedAt { storedFocusSeconds += Date().timeIntervalSince(start); focusStartedAt = nil } else { focusStartedAt = Date() }; objectWillChange.send(); writeAutoBackup() }
    var toiletSeconds: Double { storedToiletSeconds + (toiletStartedAt.map { max(0, now.timeIntervalSince($0)) } ?? 0) }
    var toiletLabel: String { String(format: "%02d:%02d:%02d", Int(toiletSeconds) / 3600, Int(toiletSeconds) % 3600 / 60, Int(toiletSeconds) % 60) }
    func toggleToilet() { if let start = toiletStartedAt { storedToiletSeconds += Date().timeIntervalSince(start); toiletStartedAt = nil } else { toiletStartedAt = Date() }; objectWillChange.send(); writeAutoBackup() }
    func increment(_ key: String) { switch key { case "flow": flowCount += 1; case "workSkill": workSkillCount += 1; case "lifeSkill": lifeSkillCount += 1; case "mask": maskCount += 1; case "coffee": coffeeCount += 1; case "sarcasm": sarcasmCount += 1; case "dad": dadCount += 1; default: joyCount += 1 }; objectWillChange.send(); writeAutoBackup() }
    var verdict: (String, String) { if dadCount >= 3 { return ("今日老登", "输出很多，听取意见很少。") }; if sarcasmCount >= 3 { return ("语言艺术家", "没有直接说，但该懂的都懂了。") }; if maskCount >= 4 { return ("奥斯卡在逃影后", "表面配合，内心已经下班。") }; if focusSeconds >= 7200 { return ("心流战神", "今天真的做成了一点东西。") }; if joyCount >= 3 { return ("快乐漏网之鱼", "工作居然没能完全毁掉今天。") }; return ("平静打工人", "今日暂未检测到明显班味。") }
    var arrivalLine: String { let date = Date(timeIntervalSince1970: arrivalTimestamp), planned = Calendar.current.date(bySettingHour: startHour, minute: 0, second: 0, of: date)!; let minutes = Int(date.timeIntervalSince(planned) / 60); return minutes < -2 ? "提前上班 \(-minutes) 分钟，公司知道吗？" : minutes > 2 ? "今日 \(date.formatted(date: .omitted, time: .shortened)) 到岗" : "准点开工，分秒不多送" }
    var leaveLine: String { let planned = Calendar.current.date(bySettingHour: endHour, minute: 0, second: 0, of: now)!; let minutes = Int(planned.timeIntervalSince(now) / 60); return minutes > 0 ? "提前下班 \(minutes) 分钟，赎回 (symbol)\((hourlyRate * Double(minutes) / 60).formatted(.number.precision(.fractionLength(2)))) 的人生" : "加班 \(-minutes) 分钟，公司暂未表达感谢" }

    func setNotifications(_ enabled: Bool) async {
        if enabled { let ok = (try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])) ?? false; notificationsEnabled = ok; if ok { scheduleNotifications() } } else { notificationsEnabled = false; UNUserNotificationCenter.current().removeAllPendingNotificationRequests() }
    }
    func scheduleNotifications() { let center = UNUserNotificationCenter.current(); center.removePendingNotificationRequests(withIdentifiers: ["leave-soon", "leave-now"]); for (id, minute, title, body) in [("leave-soon", -10, "还有十分钟下班", "停止创造新问题，开始安全着陆。"), ("leave-now", 0, "下班啦下班啦", "钱拿好，我们走。") ] { let content = UNMutableNotificationContent(); content.title = title; content.body = body; content.sound = .default; var date = DateComponents(); date.hour = endHour; date.minute = minute < 0 ? 50 : 0; if minute < 0 { date.hour = max(0, endHour - 1) }; center.add(UNNotificationRequest(identifier: id, content: content, trigger: UNCalendarNotificationTrigger(dateMatching: date, repeats: true))) } }

    func exportData() {
        let panel = NSSavePanel(); panel.nameFieldStringValue = "banpet-\(todayKey).json"; panel.allowedContentTypes = [.json]
        guard panel.runModal() == .OK, let url = panel.url else { return }
        let salary: [String: Any] = ["currency": currency, "salary": monthlySalary, "startTime": String(format: "%02d:00", startHour), "endTime": String(format: "%02d:00", endHour), "workDays": workDays]
        let events: [String: Any] = ["focusSeconds": focusSeconds, "focusStartedAt": NSNull(), "toiletSeconds": toiletSeconds, "toiletStartedAt": NSNull(), "flow": flowCount, "workSkill": workSkillCount, "lifeSkill": lifeSkillCount, "mask": maskCount, "joy": joyCount, "coffee": coffeeCount, "sarcasm": sarcasmCount, "dad": dadCount]
        let daily: [String: Any] = ["date": todayKey, "frustration": 0, "meetingSeconds": meetingMinutes * 60, "meetingStartedAt": NSNull(), "events": events]
        let payload: [String: Any] = ["format": "banpet-local-v1", "exportedAt": ISO8601DateFormatter().string(from: Date()), "data": ["banpetSalary": salary, "banpetDaily": daily]]
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys]) { try? data.write(to: url) }
    }

    func chooseAutoBackup() {
        let panel = NSSavePanel(); panel.nameFieldStringValue = "banpet-auto-backup.json"; panel.allowedContentTypes = [.json]
        guard panel.runModal() == .OK, let url = panel.url else { return }
        autoBackupPath = url.path; writeAutoBackup()
    }
    func writeAutoBackup() {
        guard !autoBackupPath.isEmpty else { return }
        let events: [String: Any] = ["focusSeconds": focusSeconds, "toiletSeconds": toiletSeconds, "flow": flowCount, "workSkill": workSkillCount, "lifeSkill": lifeSkillCount, "mask": maskCount, "joy": joyCount, "coffee": coffeeCount, "sarcasm": sarcasmCount, "dad": dadCount]
        let payload: [String: Any] = ["format": "banpet-local-v1", "exportedAt": ISO8601DateFormatter().string(from: Date()), "data": ["banpetSalary": ["currency": currency, "salary": monthlySalary, "startTime": String(format: "%02d:00", startHour), "endTime": String(format: "%02d:00", endHour), "workDays": workDays], "banpetDaily": ["date": todayKey, "events": events]]]
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys]) { try? data.write(to: URL(fileURLWithPath: autoBackupPath), options: .atomic) }
    }

    func importData() {
        let panel = NSOpenPanel(); panel.allowedContentTypes = [.json]; panel.allowsMultipleSelection = false
        guard panel.runModal() == .OK, let url = panel.url, let raw = try? Data(contentsOf: url), let root = try? JSONSerialization.jsonObject(with: raw) as? [String: Any], root["format"] as? String == "banpet-local-v1", let data = root["data"] as? [String: Any] else { return }
        if let salary = data["banpetSalary"] as? [String: Any] { currency = salary["currency"] as? String ?? currency; monthlySalary = Double("\(salary["salary"] ?? monthlySalary)") ?? monthlySalary; workDays = Double("\(salary["workDays"] ?? workDays)") ?? workDays; if let s = salary["startTime"] as? String { startHour = Int(s.prefix(2)) ?? startHour }; if let e = salary["endTime"] as? String { endHour = Int(e.prefix(2)) ?? endHour } }
        if let daily = data["banpetDaily"] as? [String: Any], daily["date"] as? String == todayKey, let events = daily["events"] as? [String: Any] { storedFocusSeconds = events["focusSeconds"] as? Double ?? 0; storedToiletSeconds = events["toiletSeconds"] as? Double ?? 0; flowCount = events["flow"] as? Int ?? 0; workSkillCount = events["workSkill"] as? Int ?? 0; lifeSkillCount = events["lifeSkill"] as? Int ?? 0; maskCount = events["mask"] as? Int ?? 0; joyCount = events["joy"] as? Int ?? 0; coffeeCount = events["coffee"] as? Int ?? 0; sarcasmCount = events["sarcasm"] as? Int ?? 0; dadCount = events["dad"] as? Int ?? 0; dailyDate = todayKey }
        objectWillChange.send()
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
            Text(model.arrivalLine).font(.caption).foregroundStyle(.secondary)
            Divider()
            Button(model.focusStartedAt == nil ? "🎧 开始专注 · \(model.focusLabel)" : "⏹ 结束专注 · \(model.focusLabel)") { model.toggleFocus() }
            HStack { event("🌊 心流", model.flowCount, "flow"); event("🧠 工作技能", model.workSkillCount, "workSkill") }
            HStack { event("🌱 兴趣技能", model.lifeSkillCount, "lifeSkill"); event("🎭 假面营业", model.maskCount, "mask") }
            event("✨ 开心时刻", model.joyCount, "joy")
            Button(model.toiletStartedAt == nil ? "🚽 带薪上厕所 · \(model.toiletLabel)" : "⏹ 结束带薪厕所 · \(model.toiletLabel)") { model.toggleToilet() }
            HStack { event("☕️ 咖啡", model.coffeeCount, "coffee"); event("🥷 阴阳怪气", model.sarcasmCount, "sarcasm") }
            event("👴 爹味输出", model.dadCount, "dad")
            VStack(alignment: .leading, spacing: 2) { Text("今日判词 · \(model.verdict.0)").bold(); Text(model.verdict.1).font(.caption).foregroundStyle(.secondary) }
            HStack {
                SettingsLink { Text("设置") }
                Spacer()
                Button("收工") { let alert = NSAlert(); alert.messageText = model.leaveLine; alert.informativeText = "今日判词：\(model.verdict.0)"; alert.addButton(withTitle: "下班！"); alert.addButton(withTitle: "再等等"); if alert.runModal() == .alertFirstButtonReturn { NSApplication.shared.terminate(nil) } }
            }
        }
        .padding(18)
        .frame(width: 330)
    }

    private func metric(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) { Text(title).font(.caption); Text(value).font(.system(.body, design: .monospaced)).bold() }
    }
    private func event(_ title: String, _ count: Int, _ key: String) -> some View { Button("\(title)  \(count)") { model.increment(key) }.frame(maxWidth: .infinity) }
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
            Toggle("下班前 10 分钟及下班时提醒", isOn: $model.notificationsEnabled).onChange(of: model.notificationsEnabled) { _, value in Task { await model.setNotifications(value) } }
            HStack {
                Text(model.calendarStatus)
                Spacer()
                Button("连接 Calendar") { Task { await model.requestCalendar() } }
            }
            HStack { Button("导入网页数据…") { model.importData() }; Button("导出本地数据…") { model.exportData() } }
            HStack { Button("选择自动备份文件…") { model.chooseAutoBackup() }; if !model.autoBackupPath.isEmpty { Text(URL(fileURLWithPath: model.autoBackupPath).lastPathComponent).font(.caption) } }
            Text("工资与会议统计只存在这台 Mac。Calendar 事件标题不会保存。")
                .font(.caption).foregroundStyle(.secondary)
        }
        .formStyle(.grouped)
        .padding()
        .frame(width: 470, height: 480)
    }
}
