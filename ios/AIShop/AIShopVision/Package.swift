// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AIShopVision",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "AIShopVision", targets: ["AIShopVision"]),
               .executable(name: "AIShopVisionEvaluate", targets: ["AIShopVisionEvaluate"])],
    targets: [
        .target(name: "AIShopVision"),
        .target(name: "AIShopVisionEvaluation", dependencies: ["AIShopVision"]),
        .executableTarget(name: "AIShopVisionEvaluate", dependencies: ["AIShopVisionEvaluation"]),
        .testTarget(name: "AIShopVisionTests", dependencies: ["AIShopVision", "AIShopVisionEvaluation"],
                    resources: [.copy("Resources")])
    ]
)
