// sim-window.swift — print the on-screen bounds of the booted Simulator window.
// Useful for sanity-checking coordinate math for sim-tap.swift, or confirming
// the Simulator is actually on screen before driving it.
//
// Usage: swift sim-window.swift
// Prints: "Simulator x=<X> y=<Y> w=<W> h=<H>" for each layer-0 Simulator window,
// or "NONE" if no Simulator window is visible.
import CoreGraphics
import Foundation

let opts = CGWindowListOption([.optionOnScreenOnly, .excludeDesktopElements])
let list = (CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]]) ?? []
var found = false
for w in list {
    guard let owner = w[kCGWindowOwnerName as String] as? String, owner == "Simulator",
          let layer = w[kCGWindowLayer as String] as? Int, layer == 0,
          let b = w[kCGWindowBounds as String] as? [String: CGFloat] else { continue }
    if b["Width"]! > 300, b["Height"]! > 300 {
        print("Simulator x=\(b["X"]!) y=\(b["Y"]!) w=\(b["Width"]!) h=\(b["Height"]!)")
        found = true
    }
}
if !found { print("NONE"); exit(2) }
