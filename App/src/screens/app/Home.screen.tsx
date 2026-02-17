import MainLayout from "@/layouts/Main.layout";
import { useChartData } from "@/components/graphs/useChartData";
import { ChartCard } from "@/components/graphs/ChartsCard";
import { BarChart, LineChart } from "@/components/graphs/Chart";

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

  const { averageValue } = useChartData({ data: chartData });

  return (
    <MainLayout>
      <ChartCard
        title="Bar graph"
        description="Past 7 days"
        averageLabel="Avg Steps"
        averageValue={averageValue}
        onPress={() => console.log("pressed")}
      >
        <BarChart
          data={chartData}
          showAverageLine
          averageValue={averageValue}
        />
      </ChartCard>

      <ChartCard
        title="Line graph"
        description="Linear with dots"
        averageLabel="Avg Steps"
        averageValue={averageValue}
        onPress={() => console.log("pressed")}
      >
        <LineChart
          data={chartData}
          curveType="linear"
          showDots={false}
          showAverageLine
          averageValue={averageValue}
        />
      </ChartCard>

      <ChartCard
        title="Line graph"
        description="Curved with dots"
        averageLabel="Avg Steps"
        averageValue={averageValue}
        onPress={() => console.log("pressed")}
      >
        <LineChart
          data={chartData}
          curveType="curved"
          showDots={false}
          showAverageLine
          averageValue={averageValue}
        />
      </ChartCard>
    </MainLayout>
  );
}