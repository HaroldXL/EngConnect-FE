import { Card, CardBody, Skeleton } from "@heroui/react";
import { useThemeColors } from "../../hooks/useThemeColors";

/** @param {{ count?: number }} props */
export default function StudentsSkeleton({ count = 5 }) {
  const colors = useThemeColors();

  const enrollmentRow = (
    <div
      className="flex gap-3 p-3 rounded-xl"
      style={{ backgroundColor: colors.background.gray }}
    >
      <Skeleton className="w-28 h-20 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <Skeleton className="h-2 flex-1 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <Card
          key={i}
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded-lg" />
                  <Skeleton className="h-3 w-48 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-xl flex-shrink-0" />
            </div>

            <div
              className="h-px my-4"
              style={{ backgroundColor: colors.border.medium }}
            />

            <div className="space-y-3">
              {enrollmentRow}
              {i % 3 === 0 && enrollmentRow}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
