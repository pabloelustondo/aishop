import XCTest
@testable import AIShop

@MainActor
final class ScanNavigationTests: XCTestCase {
    func testOpensEachModeAndReturnsToSelection() {
        let navigation = AppNavigationModel()
        XCTAssertNil(navigation.selectedMode)

        navigation.select(.targetProduct)
        XCTAssertEqual(navigation.selectedMode, .targetProduct)
        navigation.showModes()
        XCTAssertNil(navigation.selectedMode)

        navigation.select(.areaScan)
        XCTAssertEqual(navigation.selectedMode, .areaScan)
        navigation.showModes()
        XCTAssertNil(navigation.selectedMode)
    }

    func testFormatsVisibleAppVersion() {
        XCTAssertEqual(
            AppVersion.display(shortVersion: "1.1", build: "2"),
            "Version 1.1 · Build 2"
        )
    }
}
