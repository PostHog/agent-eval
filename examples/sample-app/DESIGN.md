---
name: Northstar Supply
description: A practical field-guide storefront for dependable outdoor equipment.
colors:
  ink: "#20241f"
  spruce: "#253629"
  moss: "#53674f"
  paper: "#f3f0e8"
  surface: "#faf8f2"
  sand: "#c6aa77"
  clay: "#a65536"
  line: "#cfc8b9"
  muted: "#596455"
typography:
  display:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, serif"
    fontSize: "clamp(3.2rem, 8vw, 6rem)"
    fontWeight: 500
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Avenir Next, Avenir, Trebuchet MS, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
rounded:
  control: "0.35rem"
  pill: "999px"
spacing:
  control-x: "1.05rem"
  control-y: "0.65rem"
components:
  button-primary:
    backgroundColor: "{colors.spruce}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "{spacing.control-y} {spacing.control-x}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "{spacing.control-y} 0.8rem"
---

# Design system: Northstar Supply

## Overview

**Creative North Star: "The working field guide"**

Northstar Supply uses the clear hierarchy and practical detail of a trusted equipment guide. Large editorial headings introduce a route. Fine rules, direct labels, and product facts help shoppers make a decision without decorative clutter.

Key characteristics:

- Earth colors with strong spruce text and controls
- Large serif headlines paired with compact sans-serif utility text
- Full-width photography and simple ruled lists
- Flat surfaces that use color and spacing instead of shadows

## Colors

Spruce and ink carry actions and text. Oatmeal paper and pale surfaces keep long pages readable. Clay marks selected or important states. Sand supports product photography.

## Typography

Display text uses Iowan Old Style with Palatino fallbacks. Body and control text use Avenir Next with practical sans-serif fallbacks. Headings stay below 6rem and use tight line-height. Body copy stays near 65–75 characters where possible.

## Layout

The primary container is 1180px wide with responsive outer gutters. Desktop pages use uneven two-column layouts for editorial rhythm. They collapse to one column below 760–900px. Product grids move from three columns to two and then one.

## Elevation & Depth

The system has no shadows. Depth comes from solid color changes, photography, borders, and modal backdrop contrast.

## Shapes

Inputs use small 0.35rem corners. Action buttons and filter controls use pill shapes. Product images and editorial photography keep square corners.

## Components

Primary buttons use spruce with a pale label and a moss hover state. Secondary buttons use a spruce outline. Inputs use pale surfaces with thin neutral borders. Cards use a top rule instead of a box. Navigation stays flat and gains an underline on hover.

## Do's and Don'ts

### Do

- Do use ruled lists for comparable product details.
- Do keep status and recovery copy direct.
- Do use photography at a meaningful scale.

### Don't

- Don't add gradients, decorative shadows, or glass effects.
- Don't place every section inside a rounded card.
- Don't use uppercase labels as decoration.
