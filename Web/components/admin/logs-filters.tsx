"use client";

import { parseDate } from "@internationalized/date";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { DateValue } from "react-aria-components";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  DateField,
  DatePicker,
  DatePickerPopover,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
  Form,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  PopoverDialog,
  Select,
  TextField,
} from "@/components/ui/heroui";

type LogsFiltersProps = {
  initialContext?: string;
  initialLevel?: string;
  initialDateStart?: string;
  initialDateEnd?: string;
};

const LEVEL_OPTIONS = [
  { key: "all", label: "All levels", value: "" },
  { key: "debug", label: "debug", value: "debug" },
  { key: "log", label: "log", value: "log" },
  { key: "warn", label: "warn", value: "warn" },
  { key: "error", label: "error", value: "error" },
  { key: "critical", label: "critical", value: "critical" },
] as const;

function toLocalDateInput(value: string) {
  if (!value) return "";
  const isoPrefix = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toLocalDateValue(value: string): DateValue | null {
  const localValue = toLocalDateInput(value);
  if (!localValue) return null;

  try {
    return parseDate(localValue);
  } catch {
    return null;
  }
}

function toApiDateTimeValue(value: DateValue | null, mode: "start" | "end") {
  if (!value) return "";

  const date = new Date(
    value.year,
    value.month - 1,
    value.day,
    mode === "end" ? 23 : 0,
    mode === "end" ? 59 : 0,
    mode === "end" ? 59 : 0,
    mode === "end" ? 999 : 0,
  );

  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function InlineDatePicker({
  ariaLabel,
  label,
  value,
  onChange,
}: {
  ariaLabel: string;
  label: string;
  value: DateValue | null;
  onChange: (value: DateValue | null) => void;
}) {
  return (
    <DatePicker
      aria-label={ariaLabel}
      className="min-w-0 sm:w-52"
      onChange={onChange}
      value={value}
    >
      <Label className="sr-only">{label}</Label>

      <DateField.Group className="w-full" fullWidth variant="secondary">
        <DateField.Prefix className="admin-detail-label px-1">
          {label}
        </DateField.Prefix>

        <DateField.InputContainer>
          <DateField.Input>
            {(segment) => <DateField.Segment key={segment.type} segment={segment} />}
          </DateField.Input>
        </DateField.InputContainer>

        <DateField.Suffix>
          <DatePickerTrigger aria-label={`Open ${ariaLabel.toLowerCase()} picker`}>
            <DatePickerTriggerIndicator>
              <CalendarDays className="h-4 w-4" />
            </DatePickerTriggerIndicator>
          </DatePickerTrigger>
        </DateField.Suffix>
      </DateField.Group>

      <DatePickerPopover placement="bottom start">
        <PopoverDialog className="p-3">
          <Calendar>
            <CalendarHeader className="mb-3 flex items-center justify-between gap-2">
              <CalendarNavButton
                aria-label="Previous month"
                className="admin-subtle-control"
                slot="previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </CalendarNavButton>
              <CalendarHeading className="text-sm font-medium" />
              <CalendarNavButton
                aria-label="Next month"
                className="admin-subtle-control"
                slot="next"
              >
                <ChevronRight className="h-4 w-4" />
              </CalendarNavButton>
            </CalendarHeader>

            <CalendarGrid>
              <CalendarGridHeader>
                {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => <CalendarCell date={date} />}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </PopoverDialog>
      </DatePickerPopover>
    </DatePicker>
  );
}

export function LogsFilters({
  initialContext = "",
  initialLevel = "",
  initialDateStart = "",
  initialDateEnd = "",
}: LogsFiltersProps) {
  const router = useRouter();
  const [context, setContext] = useState(initialContext);
  const [level, setLevel] = useState(initialLevel);
  const [dateStart, setDateStart] = useState<DateValue | null>(
    toLocalDateValue(initialDateStart),
  );
  const [dateEnd, setDateEnd] = useState<DateValue | null>(
    toLocalDateValue(initialDateEnd),
  );

  function applyFilters() {
    const params = new URLSearchParams();

    if (context.trim()) params.set("context", context.trim());
    if (level.trim()) params.set("level", level.trim());

    const apiDateStart = toApiDateTimeValue(dateStart, "start");
    const apiDateEnd = toApiDateTimeValue(dateEnd, "end");

    if (apiDateStart) params.set("dateStart", apiDateStart);
    if (apiDateEnd) params.set("dateEnd", apiDateEnd);

    const href = params.toString() ? `/admin/logs?${params.toString()}` : "/admin/logs";

    startTransition(() => {
      router.replace(href);
    });
  }

  function clearFilters() {
    setContext("");
    setLevel("");
    setDateStart(null);
    setDateEnd(null);

    startTransition(() => {
      router.replace("/admin/logs");
    });
  }

  return (
    <Form
      className="flex flex-wrap items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
    >
      <TextField className="min-w-0 sm:w-56 lg:w-[18rem]" name="context" value={context}>
        <Label className="sr-only">Context</Label>
        <Input
          onChange={(event) => setContext(event.target.value)}
          placeholder="Context"
          variant="secondary"
        />
      </TextField>

      <Select
        aria-label="Level"
        className="min-w-0 sm:w-44"
        selectedKey={level || "all"}
        onSelectionChange={(key) =>
          setLevel(key && String(key) !== "all" ? String(key) : "")
        }
        variant="secondary"
      >
        <Label className="sr-only">Level</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox items={LEVEL_OPTIONS}>
            {(item) => (
              <ListBoxItem id={item.key} key={item.key} textValue={item.label}>
                {item.label}
              </ListBoxItem>
            )}
          </ListBox>
        </Select.Popover>
      </Select>

      <InlineDatePicker
        ariaLabel="Start date"
        label="From"
        onChange={setDateStart}
        value={dateStart}
      />

      <InlineDatePicker
        ariaLabel="End date"
        label="To"
        onChange={setDateEnd}
        value={dateEnd}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary">
          Apply
        </Button>
        <Button onPress={clearFilters} type="button" variant="tertiary">
          Clear
        </Button>
      </div>
    </Form>
  );
}
