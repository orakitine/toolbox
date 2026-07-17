// sim-tap.swift — tap the Simulator at DEVICE-POINT coordinates by posting a
// macOS CGEvent click mapped through the Simulator window.
//
// ⚠️ UNRELIABLE. Synthetic clicks do not always convert to device touches, and
// they do NOT work on native Safari UI (cert interstitials, share sheets). For
// WEB CONTENT, prefer dispatching a JS click via sim-session.mjs, e.g.:
//   node sim-session.mjs js "document.querySelector('#openBtn').click(); return 'ok'"
// Keep this only for cases where a real hit-test coordinate is unavoidable.
//
// Usage:  swift sim-tap.swift <deviceX> <deviceY>
//   Device points are portrait logical points (e.g. 0..1024 x, 0..1366 y on an
//   iPad Air 13"). Read a target's device coords from getBoundingClientRect()
//   via sim-session.mjs, or from a device screenshot (screenshot px / 2).

import AppKit
import CoreGraphics

let args = CommandLine.arguments
guard args.count >= 3, let dx = Double(args[1]), let dy = Double(args[2]) else {
    print("usage: swift sim-tap.swift <deviceX> <deviceY>"); exit(2)
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
// silently does nothing while the script reports success.
guard CGPreflightPostEventAccess() else {
    print("NO_ACCESSIBILITY_PERMISSION — grant this terminal app Accessibility in System Settings > Privacy & Security > Accessibility, then retry")
    exit(2)
}

guard let win = simWindow() else { print("SIMULATOR_WINDOW_NOT_FOUND"); exit(2) }

// activate via title bar (x clamped off the traffic-light buttons)
let title = CGPoint(x: max(win.minX + 80, win.midX - 200), y: win.minY + 14)
post(.mouseMoved, title); usleep(120000)
post(.leftMouseDown, title); usleep(60000); post(.leftMouseUp, title)
usleep(400000)

// Map device points -> screen. The device screen fills the window below its
// title bar; height is assumed the portrait long edge (1366 for iPad Air 13").
// Override via env SIM_DEVICE_PTS_H if your device differs.
let devH = Double(ProcessInfo.processInfo.environment["SIM_DEVICE_PTS_H"] ?? "1366") ?? 1366
let devW = Double(ProcessInfo.processInfo.environment["SIM_DEVICE_PTS_W"] ?? "1024") ?? 1024
let scale = win.width / devW
let titleBar = win.height - devH * scale
let p = CGPoint(x: win.minX + dx * scale, y: win.minY + titleBar + dy * scale)

post(.mouseMoved, p); usleep(150000)
post(.leftMouseDown, p); usleep(70000)
post(.leftMouseUp, p)
print("TAP device(\(dx),\(dy)) -> screen\(p)")
