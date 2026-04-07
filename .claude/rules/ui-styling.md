---
paths:
  - "app/features/**/components/**"
  - "app/common/components/**"
  - "app/common/pages/**"
---

# UI & 스타일 규칙

## Shadcn UI
- Radix 직접 import 금지 → 항상 `~/common/components/ui/*`에서 import
- `cn()` 유틸리티: `import { cn } from "~/lib/utils";`

## Tailwind CSS 4

### 시맨틱 토큰 사용 (raw 색상 금지)
| 용도   | 토큰                                       |
| ------ | ------------------------------------------ |
| 배경   | `bg-background`, `bg-card`, `bg-muted`     |
| 텍스트 | `text-foreground`, `text-muted-foreground`  |
| 테두리 | `border-border`, `border-input`            |
| 강조   | `bg-primary`, `text-primary-foreground`    |

`bg-white`, `text-gray-500` 등 raw 색상 금지

### v3 → v4 클래스명 변경
| v3 (금지)           | v4 (사용)       |
| ------------------- | --------------- |
| `flex-shrink-0`     | `shrink-0`      |
| `flex-grow`         | `grow`          |
| `overflow-ellipsis` | `text-ellipsis` |

### Arbitrary values 금지
`w-[140px]`, `text-[14px]` 등 사용 금지 → Tailwind 프리셋 클래스 사용

## 폼 패턴
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl, FormMessage } from "~/common/components/ui/form";
```

## 알림
```typescript
import { toast } from "sonner";
toast.success("저장 완료");
toast.error("오류 발생", { description: "다시 시도해주세요." });
```
