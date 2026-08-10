import FirebaseAuth
import FirebaseCore
import GoogleSignIn
import UIKit

enum GoogleSignInBridge {
    static func signIn(presenting: UIViewController) async throws {
        guard let clientID = FirebaseApp.app()?.options.clientID else {
            throw APIError.configuration("Firebase is not configured.")
        }
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenting)
        guard let idToken = result.user.idToken?.tokenString else {
            throw APIError.configuration("Google sign-in did not return a token.")
        }
        let credential = GoogleAuthProvider.credential(
            withIDToken: idToken, accessToken: result.user.accessToken.tokenString
        )
        try await Auth.auth().signIn(with: credential)
    }
}
