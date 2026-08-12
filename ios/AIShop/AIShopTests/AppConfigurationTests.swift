import XCTest
@testable import AIShop

final class AppConfigurationTests: XCTestCase {
    func testValidConfigurationIsAccepted() throws {
        let url = try AppConfiguration.validate(serverURL: "https://api.shop.test/base")
        XCTAssertEqual(url.absoluteString, "https://api.shop.test/base")
    }

    func testPlaceholderAndNonHTTPSURLsAreRejected() {
        for value in ["https://example.invalid", "http://api.shop.test", "$(AI_SHOP_SERVER_BASE_URL)"] {
            XCTAssertThrowsError(try AppConfiguration.validate(serverURL: value)) { error in
                XCTAssertEqual(
                    error as? APIError,
                    .configuration("Configure AI_SHOP_SERVER_BASE_URL with the server HTTPS address.")
                )
            }
        }
    }
}
