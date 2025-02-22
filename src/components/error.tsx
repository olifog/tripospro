import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { AlertTriangle } from "lucide-react";

const errorMessageVariants = cva("flex items-center text-left", {
  variants: {
    variant: {
      default: "flex-col gap-4 p-8 text-center",
      compact: "gap-2 p-2"
    },
    size: {
      default: "",
      sm: "",
      lg: "gap-6"
    }
  },
  defaultVariants: {
    variant: "default",
    size: "default"
  }
});

interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorMessageVariants> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  iconClassName?: string;
}

export function ErrorMessage({
  title = "Something went wrong",
  description = "An error occurred while loading this content. Please try again later.",
  action,
  className,
  variant,
  size,
  iconClassName,
  ...props
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        errorMessageVariants({ variant, size }),
        "h-full w-full",
        className
      )}
      {...props}
    >
      <AlertTriangle
        className={cn(
          "shrink-0 text-destructive",
          variant === "compact" ? "size-8" : "size-12",
          iconClassName
        )}
      />
      <div className={cn("min-w-0", variant === "default" && "space-y-1")}>
        <h3
          className={cn(
            "truncate font-semibold",
            variant === "compact" ? "text-sm" : "text-lg"
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              "truncate text-muted-foreground",
              variant === "compact" ? "text-xs" : "text-sm"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
