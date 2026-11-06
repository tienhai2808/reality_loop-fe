import { CapabilityBar } from "@/components/reality/capability-bar"
import { PageHeader } from "@/components/shared/page-header"

export default function ProgressPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Tiến độ</PageHeader.Title>
        <PageHeader.Description>
          Khả năng sử dụng ngôn ngữ theo từng tình huống.
        </PageHeader.Description>
      </PageHeader>
      <section className="space-y-5 rounded-lg border border-border bg-surface p-5">
        <CapabilityBar label="Nhà hàng" value={81} />
        <CapabilityBar label="Mua sắm" value={64} />
        <CapabilityBar label="Di chuyển" value={53} />
        <CapabilityBar label="Xử lý khi hội thoại gián đoạn" value={44} />
      </section>
    </div>
  )
}
