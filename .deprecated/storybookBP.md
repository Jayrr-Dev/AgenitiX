# 📘 Storybook Best Practices for Frontend Teams

This guide outlines industry-proven best practices for integrating Storybook into your component-driven development workflow. Whether you're a solo dev or on a team of 40+, these principles ensure scalability, testability, and maintainability.

---

## 🎯 Philosophy: Storybook-Driven Development (SDD)

> Think of writing stories like writing unit tests — but visual and interactive.

* ✅ **You build components *in* Storybook first**
* 🔁 **Your app imports tested components** — not the other way around
* 🧱 Components must receive *everything* via props (no implicit globals)

---

## 🧱 Component Architecture: Atomic Design

Adopt [Atomic Design Principles](https://bradfrost.com/blog/post/atomic-web-design/) to standardize your components:

| Level         | Description                                                              |
| ------------- | ------------------------------------------------------------------------ |
| **Atoms**     | Smallest elements (e.g., Button, Input, Icon)                            |
| **Molecules** | Combinations of atoms (e.g., Input + Label)                              |
| **Organisms** | Full modules (e.g., Form, NavBar) with structure but no global knowledge |
| **Partials**  | May use app context/state (e.g., Formik, Theme) — use sparingly          |

All components below `partials`:

* Must **only use props**
* Should be **portable** across projects
* Must be **tested via stories** in isolation

---

## 📁 Directory Structure

```bash
/components
├── atoms
│   ├── Button.tsx
│   └── Button.stories.tsx
├── molecules
│   └── InputGroup.tsx
├── organisms
│   └── SignUpForm.tsx
├── partials
│   └── AuthenticatedForm.tsx
```

---

## 🧪 Writing Stories as Tests

Treat Storybook like a visual test suite:

```tsx
// Button.stories.tsx
import { Button } from './Button';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { label: 'Click me', variant: 'primary' },
};

export const Disabled: Story = {
  args: { label: 'Can't click', disabled: true },
};
```

✅ Each `Story`:

* Represents a **state** or **test case**
* Acts as **documentation** for designers & developers
* Can be tested using tools like `@storybook/addon-storyshots`

---

## 🔄 Pages & Templates Rule

> Pages/templates are **containers**, not feature components.

* ❌ No raw HTML
* ✅ Only composed of reusable components
* ✅ Allowed to hold layout and global logic only

---

## 🌍 Global Providers

Use decorators in `.storybook/preview.ts` to provide themes, routers, or contexts *only where needed*.

```tsx
// .storybook/preview.ts
import { ThemeProvider } from '@/components/theme-provider';

export const decorators = [
  (Story) => (
    <ThemeProvider>
      <Story />
    </ThemeProvider>
  ),
];
```

---

## 🔌 Recommended Addons

| Addon                           | Purpose                          |
| ------------------------------- | -------------------------------- |
| `@storybook/addon-essentials`   | Controls, Docs, Actions          |
| `storybook-dark-mode`           | Dark/light theme toggle          |
| `@storybook/addon-a11y`         | Accessibility checks             |
| `@storybook/addon-storyshots`   | Jest snapshot tests from stories |
| `storybook-addon-pseudo-states` | Test hover/focus/active states   |

---

## ✅ Summary: Why This System Works

* 🧪 **Stories double as tests** (visual, snapshot, and behavioral)
* 📦 **Components are portable** by design
* 🔍 **Onboarding is fast** — everything is documented visually
* 🚀 **Scaling is easy** — works with small and large teams
* 🛠️ **No redundant dev pages** or manual test routes

---

## 💡 Pro Tips

* Co-locate `.stories.tsx` with components for clarity
* Write stories *before* or *alongside* component implementation
* Never skip edge states (loading, empty, error)
* Use [Controls](https://storybook.js.org/docs/react/essentials/controls) to simulate real props live
* Prefer `args`-based stories over `render()` unless needed

---

By following these best practices, you build a component library that is:

* Predictable
* Maintainable
* Portable
* Testable

Let your UI tell its own story.

> "If your component can’t render in Storybook, it’s not reusable."
