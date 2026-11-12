// The Account section of Settings: the profile photo and the account
// fields. Every keystroke is kept at once; "Save changes" only shows the
// message (docs/AUDIT.md B3). The state and handlers stay in GlobalSettings.
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const FIELDS = [
    { name: "fullName", label: "Full name", type: "text" },
    { name: "studentId", label: "Student ID", type: "text" },
    { name: "program", label: "Program / Course", type: "text" },
    { name: "yearLevel", label: "Year level", type: "text" },
    { name: "bio", label: "Short bio", multiline: true },
    { name: "email", label: "Email address", type: "email" },
    { name: "username", label: "Username", type: "text" },
];

// The photo and action buttons fill the width on phones, as before.
const PHONE_FULL = "max-sm:w-full";

// profile, initials: the account and its initials. selectedImage: a chosen
// photo not saved yet. isEditing: the fields can be changed.
// onFieldChange(event), onImageSelect(event), onSavePhoto(), onSave(),
// onEditAgain(): the GlobalSettings handlers.
export function AccountSection({
    profile,
    initials,
    selectedImage,
    isEditing,
    onFieldChange,
    onImageSelect,
    onSavePhoto,
    onSave,
    onEditAgain,
}) {
    const photo = selectedImage || profile.profilePicture;

    return (
        <Card className="gap-0 px-(--card-spacing)">
            <div className="mb-5">
                <h3 className="m-0 mb-2 type-card-title text-primary">Account details</h3>
                <p className="m-0 type-small text-muted-foreground">
                    Update the information connected to your CompuGrade account.
                </p>
            </div>

            <div className="mb-5 flex items-center justify-between gap-5.5 rounded-xl border border-solid border-border bg-muted p-4 max-lg:flex-col max-lg:items-start">
                <Avatar className="size-20.5">
                    {photo && <AvatarImage src={photo} alt="Current profile preview" />}
                    <AvatarFallback className="bg-highlight-soft type-section-title text-primary">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-wrap items-center gap-3 max-sm:w-full max-sm:flex-col max-sm:items-stretch">
                    {/* A real file input fills the button, so the whole button
                        opens the file picker and keeps its name. */}
                    <label
                        className={cn(
                            buttonVariants({ variant: "secondary" }),
                            "relative cursor-pointer overflow-hidden",
                            PHONE_FULL,
                        )}
                    >
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={onImageSelect}
                            disabled={!isEditing}
                            className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        Choose photo
                    </label>
                    <Button
                        variant="outline"
                        className={cn("bg-card", PHONE_FULL)}
                        onClick={onSavePhoto}
                        disabled={!isEditing}
                    >
                        Save photo
                    </Button>
                </div>
            </div>

            <FieldGroup className="grid gap-4.5 lg:grid-cols-2">
                {FIELDS.map(({ name, label, type, multiline }) => {
                    const id = `account-${name}`;
                    const Control = multiline ? Textarea : Input;
                    return (
                        <Field key={name} className={cn("gap-2", multiline && "lg:col-span-2")}>
                            <FieldLabel htmlFor={id} className="text-foreground">
                                {label}
                            </FieldLabel>
                            <Control
                                id={id}
                                name={name}
                                {...(multiline ? { rows: 4 } : { type })}
                                value={profile[name]}
                                onChange={onFieldChange}
                                disabled={!isEditing}
                                className={cn("bg-card", multiline && "min-h-26")}
                            />
                        </Field>
                    );
                })}
            </FieldGroup>

            <div className="mt-6 flex justify-end max-lg:mt-5 max-lg:justify-start">
                {isEditing ? (
                    <Button
                        className={cn(
                            "bg-highlight-strong text-foreground hover:bg-highlight-strong/80",
                            PHONE_FULL,
                        )}
                        onClick={onSave}
                    >
                        Save changes
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className={cn("bg-card", PHONE_FULL)}
                        onClick={onEditAgain}
                    >
                        Edit again
                    </Button>
                )}
            </div>
        </Card>
    );
}
