import MainLayout from "@/layouts/Main.layout";
import { BarChart, LineChart } from "@/components/graphs/Chart";
import { ChartCard } from "@/components/graphs/ChartsCard";

export default function Home() {
  const chartData = [
    { value: 50, label: "A" },
    { value: 80, label: "B" },
    { value: 90, label: "C" },
    { value: 70, label: "D" },
    { value: 60, label: "E" },
    { value: 70, label: "F" },
    { value: 80, label: "G" }
  ];

  return (
    <MainLayout>
      <ChartCard
        title="Bar graph"
        description="Past 7 days"
        averageDescription="Steps"
        showAverage
        openDetails={() => console.log("pressed")}
      >
        <BarChart showAverage data={chartData} />
      </ChartCard>

      <ChartCard
        title="Line graph"
        description="Linear with dots"
        averageDescription="Steps"
        showAverage
        openDetails={() => console.log("pressed")}
      >
        <LineChart showDots={false} curveType="linear" showAverage data={chartData} />
      </ChartCard>

      <ChartCard
        title="Line graph"
        description="Curved with dots"
        averageDescription="Steps"
        showAverage
        openDetails={() => console.log("pressed")}
      >
        <LineChart showDots={false} curveType="curved" showAverage data={chartData} />
      </ChartCard>
    </MainLayout>
  );
}
