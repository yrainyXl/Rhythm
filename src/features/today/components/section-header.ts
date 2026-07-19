export function buildSectionHeaderClasses() {
  return {
    wrapper: 'flex items-center justify-between mb-2',
    dot: 'w-1.5 h-1.5 rounded-full bg-rhythm-glow opacity-60',
    label: 'text-xs tracking-[0.06em] text-rhythm-text-secondary',
    action: 'text-xs text-rhythm-glow hover:text-rhythm-text-primary transition-colors bg-transparent border-0 p-0 cursor-pointer',
  }
}
