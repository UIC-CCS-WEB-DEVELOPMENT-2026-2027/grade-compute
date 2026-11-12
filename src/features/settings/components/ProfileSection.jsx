// The Profile section of Settings: read-only details of the per-browser
// account (docs/AUDIT.md B4).
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";

// profile: the account from localAccountStore. initials: shown without a photo.
export function ProfileSection({ profile, initials }) {
    const summary = [
        ["Student ID", profile.studentId],
        ["Program", profile.program],
        ["Year level", profile.yearLevel],
    ];

    return (
        <Card className="gap-0 px-(--card-spacing)">
            <div className="mb-6 flex items-center gap-4.5 max-lg:flex-col max-lg:items-start">
                <Avatar className="size-22">
                    {profile.profilePicture && (
                        <AvatarImage src={profile.profilePicture} alt="Profile" />
                    )}
                    <AvatarFallback className="bg-highlight-soft type-section-title text-primary">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-2">
                    <h3 className="m-0 type-card-title text-primary">{profile.fullName}</h3>
                    <p className="m-0 type-body text-muted-foreground">@{profile.username}</p>
                    <Badge className="h-auto bg-highlight-soft px-2.5 py-1.5 font-bold text-primary">
                        Student
                    </Badge>
                </div>
            </div>

            <div className="mb-5 grid gap-2.5 lg:grid-cols-3">
                {summary.map(([label, value]) => (
                    <Item
                        key={label}
                        variant="outline"
                        className="items-start rounded-xl bg-muted p-4"
                    >
                        <ItemContent className="gap-1.5">
                            <ItemDescription>{label}</ItemDescription>
                            <ItemTitle className="line-clamp-none text-foreground">
                                {value}
                            </ItemTitle>
                        </ItemContent>
                    </Item>
                ))}
            </div>

            <Separator className="mb-4" />
            <h4 className="m-0 mb-2 type-small font-semibold text-primary">Short bio</h4>
            <p className="m-0 type-small text-muted-foreground">{profile.bio}</p>
        </Card>
    );
}
