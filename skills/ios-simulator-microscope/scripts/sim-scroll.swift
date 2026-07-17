// sim-scroll.swift — scroll the booted iOS Simulator by posting a macOS CGEvent
// mouse DRAG over its window (iPadOS/iOS receives it as a touch pan). This is
// the reliable way to trigger toolbar-collapse / dynamic-viewport dynamics:
// safaridriver's WebDriver touch-pointer and wheel actions do NOT work on the
// Simulator (they hang / return 501).
//
// Usage:  swift sim-scroll.swift [fromFrac] [toFrac] [steps]
//   fromFrac/toFrac  vertical drag start/end as a fraction of the content area
//                    (default 0.75 -> 0.28; from>to scrolls the page DOWN).
//   steps            drag interpolation steps (default 40; more = smoother/slower).
//
// Requires: the terminal running this must hold Accessibility permission
// (System Settings > Privacy & Security > Accessibility). Check first with
// check-accessibility.swift. Prints the resolved Simulator window + the drag.

import AppKit
import CoreGraphics

let usage = """
usage: swift sim-scroll.swift [fromFrac] [toFrac] [steps]
  fromFrac/toFrac  vertical drag start/end as a fraction of the content area
                   (default 0.75 -> 0.28; from>to scrolls the page DOWN)
  steps            drag interpolation steps (default 40)
exit codes: 0 ok · 2 bad usage / Simulator window not found
"""

let args = CommandLine.arguments
if args.contains("--help") || args.contains("-h") {
    print(usage); exit(0)
}
// Strict parsing: a malformed arg must never silently default into a real drag.
func parse(_ i: Int, _ dflt: Double) -> Double {
    guard args.count > i else { return dflt }
    guard let v = Double(args[i]) else { print(usage); exit(2) }
    return v
}
let fromFrac = parse(1, 0.75)
let toFrac = parse(2, 0.28)
let steps: Int
if args.count > 3 {
    guard let s = Int(args[3]) else { print(usage); exit(2) }
    steps = s
} else {
    steps = 40
}

func simWindow() -> CGRect? {
    let opts = CGWindowListOption([.optionOnScreenOnly, .excludeDesktopElements])
    guard let list = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] else { return nil }
    for w in list {
        guard let owner = w[kCGWindowOwnerName as String] as? String, owner == "Simulator",
              let layer = w[kCGWindowLayer as String] as? Int, layer == 0,
              let b = w[kCGWindowBounds as String] as? [String: CGFloat] else { continue }
        let r = CGRect(x: b["X"]!, y: b["Y"]!, width: b["Width"]!, height: b["Height"]!)
        if r.width > 300, r.height > 300 { return r }
    }
    return nil
}

func post(_ type: CGEventType, _ p: CGPoint) {
    CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: p, mouseButton: .left)!
        .post(tap: .cghidEventTap)
}

// Refuse loudly without Accessibility permission — posting CGEvents without it
// silently does nothing, which would print SCROLL_DONE while scrolling nothing.
guard CGPreflightPostEventAccess() else {
    print("NO_ACCESSIBILITY_PERMISSION — grant this terminal app Accessibility in System Settings > Privacy & Security > Accessibility, then retry")
    exit(2)
}

guard let win = simWindow() else { print("SIMULATOR_WINDOW_NOT_FOUND"); exit(2) }

// Activate the Simulator by clicking its title bar — synthetic drags only
// register on the focused window. (NSWorkspace.activate is unreliable here.)
// Clamp away from the left edge so a narrow window never puts this click on
// the traffic-light buttons (which would close/minimize the Simulator).
let title = CGPoint(x: max(win.minX + 80, win.midX - 200), y: win.minY + 14)
post(.mouseMoved, title); usleep(120000)
post(.leftMouseDown, title); usleep(60000); post(.leftMouseUp, title)
usleep(400000)
if NSWorkspace.shared.frontmostApplication?.localizedName != "Simulator" {
    print("WARN: Simulator did not become frontmost; drag may not register")
}

// Drag vertically in the middle of the content area (skip ~60px of chrome).
let x = win.midX
let contentTop = win.minY + 60
let contentH = win.height - 80
let yFrom = contentTop + contentH * fromFrac
let yTo = contentTop + contentH * toFrac

post(.mouseMoved, CGPoint(x: x, y: yFrom)); usleep(120000)
post(.leftMouseDown, CGPoint(x: x, y: yFrom)); usleep(40000)
for i in 1...steps {
    let y = yFrom + (yTo - yFrom) * Double(i) / Double(steps)
    post(.leftMouseDragged, CGPoint(x: x, y: y))
    usleep(10000)
}
usleep(80000)
post(.leftMouseUp, CGPoint(x: x, y: yTo))
print("SCROLL_DONE window=\(win) \(Int(yFrom)) -> \(Int(yTo)) x=\(Int(x))")
