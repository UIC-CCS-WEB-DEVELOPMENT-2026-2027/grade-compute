// Sign-in and registration: field checks and the account lookups, against
// the users in the local database. Pure functions; LoginRegister saves.
export const PASSWORD_REQUIREMENTS = [
    { label: "At least 8 characters", test: (value) => value.length >= 8 },
    { label: "Special character", test: (value) => /[^A-Za-z0-9\s]/.test(value) },
    { label: "Uppercase letter", test: (value) => /[A-Z]/.test(value) },
    { label: "Number", test: (value) => /[0-9]/.test(value) },
];

export function getPasswordError(password) {
    if (!password.trim()) return "Password is required.";
    if (password.length < 8) return "Use at least 8 characters.";
    if (!PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password))) {
        return "Include an uppercase letter, a number, and a special character.";
    }
    return "";
}

export function validateAuthFields({
    mode,
    fullName = "",
    role = "student",
    identifier,
    password,
    confirmPassword = "",
}) {
    const errors = {};
    if (mode === "register") {
        if (!fullName.trim()) errors.fullName = "Full name is required.";
        else if (fullName.trim().length > 120) errors.fullName = "Use 120 characters or fewer.";
        if (!["student", "professor"].includes(role)) errors.role = "Choose Student or Professor.";
    }
    if (!identifier.trim())
        errors.identifier =
            mode === "register" ? "Email is required." : "Email or Student ID is required.";
    else if (mode === "register" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
        errors.identifier = "Enter a valid email address.";
    }
    // Sign-in checks the saved password, including existing demo accounts.
    const passwordError =
        mode === "register"
            ? getPasswordError(password)
            : !password.trim()
              ? "Password is required."
              : "";
    if (passwordError) errors.password = passwordError;
    if (mode === "register") {
        if (!confirmPassword.trim()) errors.confirmPassword = "Please confirm your password.";
        else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
}

export function registerAccount(database, fields) {
    const errors = validateAuthFields({ ...fields, mode: "register" });
    if (Object.keys(errors).length) return { errors };
    const role = fields.role ?? "student";
    const email = fields.identifier.trim().toLowerCase();
    if (
        database.users.some(
            (user) =>
                String(user.email || "")
                    .trim()
                    .toLowerCase() === email,
        )
    ) {
        return { errors: { identifier: "This email is already registered. Please log in." } };
    }
    const latestId = database.users.reduce((latest, user) => {
        const match = /^U(\d+)$/i.exec(String(user?.id || ""));
        return match ? Math.max(latest, Number(match[1])) : latest;
    }, 0);
    const user = {
        id: `U${latestId + 1}`,
        role,
        name: fields.fullName.trim().replace(/\s+/g, " "),
        email,
        password: fields.password,
        ...(role === "student" ? { programSection: "New Student" } : {}),
    };
    return { user, database: { ...database, users: [...database.users, user] } };
}

export function authenticateAccount(database, identifier, password) {
    const errors = validateAuthFields({ mode: "login", identifier, password });
    if (Object.keys(errors).length) return { errors };
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = database.users.find(
        (account) =>
            String(account.id || "").toLowerCase() === normalizedIdentifier ||
            String(account.email || "")
                .trim()
                .toLowerCase() === normalizedIdentifier,
    );
    if (!user)
        return { errors: { identifier: "Account not found. Check your email or Student ID." } };
    if (user.password !== password)
        return { errors: { password: "Incorrect password. Please try again." } };
    return { user };
}
