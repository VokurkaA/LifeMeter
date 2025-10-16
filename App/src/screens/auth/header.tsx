import { Card } from "@/components/ui/Card";
import { H1 } from "@/components/ui/Text";

function Header({name}: {name: string}) {
    return (
    <Card className="'bg-card-secondary'">
        <H1>{name}</H1>
    </Card>
    );
}
export default Header;