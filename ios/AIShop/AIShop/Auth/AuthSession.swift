import FirebaseAuth
import UIKit

@MainActor
final class AuthSession: ObservableObject {
    enum Phase: Equatable { case checking, signedOut, authenticating, signedIn }

    @Published private(set) var phase: Phase = .checking
    @Published var errorMessage: String?
    private var handle: AuthStateDidChangeListenerHandle?

    init() {
        handle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.phase = user == nil ? .signedOut : .signedIn
        }
    }

    func signUp(email: String, password: String) async {
        await run { try await Auth.auth().createUser(withEmail: email, password: password) }
    }

    func signIn(email: String, password: String) async {
        await run { try await Auth.auth().signIn(withEmail: email, password: password) }
    }

    func resetPassword(email: String) async {
        await run { try await Auth.auth().sendPasswordReset(withEmail: email) }
    }

    func signInWithGoogle(presenting: UIViewController) async {
        await run { try await GoogleSignInBridge.signIn(presenting: presenting) }
    }

    func signOut() { try? Auth.auth().signOut() }

    private func run(_ operation: @escaping () async throws -> Void) async {
        phase = .authenticating
        errorMessage = nil
        do { try await operation() } catch {
            errorMessage = error.localizedDescription
            phase = .signedOut
        }
    }
}
