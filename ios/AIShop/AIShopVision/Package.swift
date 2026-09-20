// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AIShopVision",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "AIShopVision", targets: ["AIShopVision"])],
    targets: [
        .target(name: "AIShopVision"),
        .testTarget(name: "AIShopVisionTests", dependencies: ["AIShopVision"])
    ]
)
