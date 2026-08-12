import XCTest
@testable import AIShop

final class InspectionAPIClientAuthTests: XCTestCase {
    override func tearDown() {
        StubURLProtocol.handler = nil
        super.tearDown()
    }

    func testAttachesTheCustomerIDTokenAsTheBearerCredential() async throws {
        var authorizationHeader: String?
        StubURLProtocol.handler = { request in
            authorizationHeader = request.value(forHTTPHeaderField: "Authorization")
            return self.response
        }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        let client = InspectionAPIClient(
            baseURL: URL(string: "https://shop.test")!,
            appVersion: "1.2 (3)",
            session: URLSession(configuration: configuration),
            idToken: { "customer-id-token" }
        )
        _ = try await client.analyze(jpegData: Data([0xFF, 0xD8, 0xFF, 0xD9]), mode: .targetProduct)
        XCTAssertEqual(authorizationHeader, "Bearer customer-id-token")
    }

    func testFailsWithoutAttemptingTheRequestWhenNoIDTokenIsAvailable() async {
        let client = InspectionAPIClient(
            baseURL: URL(string: "https://shop.test")!,
            appVersion: "1.2 (3)",
            idToken: { throw APIError.configuration("Sign in to submit an inspection.") }
        )
        do {
            _ = try await client.analyze(jpegData: Data([0xFF, 0xD8, 0xFF, 0xD9]), mode: .targetProduct)
            XCTFail("Expected a configuration error.")
        } catch {
            XCTAssertEqual(error as? APIError, .configuration("Sign in to submit an inspection."))
        }
    }

    private var response: (HTTPURLResponse, Data) {
        let url = URL(string: "https://shop.test/inspections")!
        let body = #"{"mode":"targetProduct","report":{"productName":"Salt","summary":"Salt","visibleEvidence":["Center"],"missingInformation":[],"conclusion":"insufficient_evidence","conclusionReason":"Price missing","confidence":"high"}}"#
        return (
            HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: nil)!,
            Data(body.utf8)
        )
    }
}
