// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "BanpetMac",
    platforms: [.macOS(.v14)],
    targets: [.executableTarget(name: "BanpetMac", path: "Sources")]
)
