import XCTest
@testable import AIShop

final class AppConfigurationTests: XCTestCase {
    func testValidConfigurationIsAccepted() throws {
        let values = try AppConfiguration.validate(
            serverURL: "https://api.shop.test/base",
            clientToken: "local-test-token"
        )
        XCTAssertEqual(values.baseURL.absoluteString, "https://api.shop.test/base")
        XCTAssertEqual(values.clientToken, "local-test-token")
    }

    func testPlaceholderAndNonHTTPSURLsAreRejected() {
        for value in ["https://example.invalid", "http://api.shop.test", "$(AI_SHOP_SERVER_BASE_URL)"] {
            XCTAssertThrowsError(
                try AppConfiguration.validate(serverURL: value, clientToken: "token")
            ) { error in
                XCTAssertEqual(
                    error as? APIError,
                    .configuration("Configure AI_SHOP_SERVER_BASE_URL with the server HTTPS address.")
                )
            }
        }
    }

    func testPlaceholderTokenIsRejected() {
        XCTAssertThrowsError(
            try AppConfiguration.validate(
                serverURL: "https://api.shop.test",
                clientToken: "CHANGE_ME"
            )
        ) { error in
            XCTAssertEqual(
                error as? APIError,
                .configuration("Configure AI_SHOP_CLIENT_TOKEN before analyzing a product.")
            )
        }
    }
}
