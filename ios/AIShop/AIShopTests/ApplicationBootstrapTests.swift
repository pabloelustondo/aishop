import XCTest
import FirebaseCore
@testable import AIShop

final class ApplicationBootstrapTests: XCTestCase {
    #if DEBUG
    func testDiagnosticTestHostHasNoFirebaseInstance() {
        XCTAssertTrue(ApplicationBootstrap.isVisionDiagnostic(), "Run with AIShop-VisionDiagnostics scheme")
        XCTAssertNil(FirebaseApp.app(), "Diagnostic startup must precede Firebase and Auth")
    }
    #endif
    func testDiagnosticRouteNeverInitializesNormalServices() {
        var calls = 0
        let value: Int? = ApplicationBootstrap.normalSession(arguments: ["app", "--vision-diagnostics"], environment: [:]) {
            calls += 1
            return 42
        }
        #if DEBUG
        XCTAssertNil(value)
        XCTAssertEqual(calls, 0)
        #else
        XCTAssertEqual(value, 42)
        XCTAssertEqual(calls, 1)
        #endif
    }

    func testOrdinaryLaunchKeepsNormalInitialization() {
        var calls = 0
        let value: Int? = ApplicationBootstrap.normalSession(arguments: ["app"], environment: [:]) {
            calls += 1
            return 42
        }
        XCTAssertEqual(value, 42)
        XCTAssertEqual(calls, 1)
    }
}
