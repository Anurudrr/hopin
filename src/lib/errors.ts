export function logDevError(context: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error)
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function mapAuthErrorMessage(error: unknown) {
  const message = getErrorMessage(error, "Authentication failed.")

  switch (message) {
    case "Invalid login credentials":
      return "Email or password is incorrect"
    case "User already registered":
      return "An account with this email already exists"
    case "Email not confirmed":
      return "Please check your email and confirm your account"
    default:
      return message
  }
}
