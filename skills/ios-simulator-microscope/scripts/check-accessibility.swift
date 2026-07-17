// check-accessibility.swift — verify the running terminal can post CGEvents
// (required by sim-scroll.swift / sim-tap.swift). If false, grant the terminal
// app Accessibility permission in System Settings > Privacy & Security >
// Accessibility. The grant applies to NEW processes without a terminal restart.
//
// Prints "postEventAccess: true|false" and exits 0 if granted, 1 if not.
import CoreGraphics

let ok = CGPreflightPostEventAccess()
print("postEventAccess: \(ok)")
exit(ok ? 0 : 1)
