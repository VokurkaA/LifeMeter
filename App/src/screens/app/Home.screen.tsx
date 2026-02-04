import { H1, H2, Text } from "@/components/Text";
import React, { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import MainLayout from "@/layouts/Main.layout";
import { Combobox } from "@/components/Combobox";
import { View } from "react-native";

type CountryOption = { value: string; label: string; flag: string; code: string };

const COUNTRIES: readonly CountryOption[] = [
  { value: "US", label: "United States", flag: "🇺🇸", code: "+1" },
  { value: "GB", label: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { value: "CA", label: "Canada", flag: "🇨🇦", code: "+1" },
  { value: "AU", label: "Australia", flag: "🇦🇺", code: "+61" },
  { value: "DE", label: "Germany", flag: "🇩🇪", code: "+49" },
  { value: "FR", label: "France", flag: "🇫🇷", code: "+33" },
  { value: "JP", label: "Japan", flag: "🇯🇵", code: "+81" },
  { value: "CN", label: "China", flag: "🇨🇳", code: "+86" },
  { value: "IN", label: "India", flag: "🇮🇳", code: "+91" },
  { value: "BR", label: "Brazil", flag: "🇧🇷", code: "+55" },
];

export default function Home() {
  const { signOut } = useAuth();

  const [country, setCountry] = useState<CountryOption | undefined>();

  return (
    <MainLayout>
      <H1>Heading!</H1>
      <H2>Subheading!</H2>

      <Combobox<CountryOption>
        options={COUNTRIES}
        value={country}
        onChange={setCountry}
        dialogTitle="Country"
        placeholder="Pick a country…"
        searchPlaceholder="Search country…"
        getOptionValue={(c) => c.value}
        getOptionLabel={(c) => c.label}
        renderOption={(c) => (
          <>
            <Text className="text-2xl">{c.flag}</Text>
            <Text className="text-sm text-muted w-12">{c.code}</Text>
            <Text className="text-base text-foreground flex-1">{c.label}</Text>
          </>
        )}
        filterOption={(c, q) =>
          c.label.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.value.toLowerCase().includes(q)
        }
      />

      {/*<Button variant='danger' onPress={signOut}>Sign Out</Button>*/}
    </MainLayout>
  );
}