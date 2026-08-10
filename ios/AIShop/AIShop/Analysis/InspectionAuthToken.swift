import FirebaseAuth
import Foundation

enum InspectionAuthToken {
    static func current() async throws -> String {
        guard let user = Auth.auth().currentUser else {
            throw APIError.configuration("Sign in to submit an inspection.")
        }
        return try await user.getIDToken()
    }
}
