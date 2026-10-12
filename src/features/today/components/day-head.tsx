export function DayHead({ dateText }: { dateText: string }) {
  return (
    <section>
      <p className="text-sm text-rhythm-text-secondary">{dateText}</p>
      <h1 className="r-page-title mt-2">今天</h1>
      <p className="r-page-description">把想做的事，做一点。</p>

    </section>
  )
}
