import MainLayout from "@/layouts/Main.layout";
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
  return (
    <MainLayout>
      <BarChart
        title="Bar graph"
        description="Past 7 days"
        averageDescription="Steps"
        showAverage
        openDetails={() => console.log('pressed')}
        data={chartData}
      />
      <LineChart
        title="Line graph"
        description="Linear with dots"
        showDots={false}
        averageDescription="Steps"
        curveType="linear"
        showAverage
        openDetails={() => console.log('pressed')}
        data={chartData}
      />
      <LineChart
        title="Line graph"
        description="Curved with dots"
        showDots={false}
        averageDescription="Steps"
        curveType="curved"
        showAverage
        openDetails={() => console.log('pressed')}
        data={chartData}
      />
    </MainLayout>
  );
}
