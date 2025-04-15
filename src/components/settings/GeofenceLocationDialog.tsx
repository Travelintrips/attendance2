import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface GeofenceLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GeofenceLocationData) => void;
  initialData?: GeofenceLocationData;
}

export interface GeofenceLocationData {
  id?: string;
  name: string;
  latitude: string;
  longitude: string;
  radius: string;
  description: string;
}

export default function GeofenceLocationDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: GeofenceLocationDialogProps) {
  const [formData, setFormData] = useState<GeofenceLocationData>(
    initialData || {
      name: "",
      latitude: "",
      longitude: "",
      radius: "100",
      description: "",
    },
  );

  // Update formData when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log("Dialog received initialData:", initialData);
      setFormData({
        id: initialData.id,
        name: initialData.name || "",
        latitude: initialData.latitude || "",
        longitude: initialData.longitude || "",
        radius: initialData.radius || "100",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create a clean copy of the form data without any undefined values
    const cleanData = Object.fromEntries(
      Object.entries(formData).filter(([_, v]) => v !== undefined),
    ) as GeofenceLocationData;

    console.log("Submitting form data:", cleanData);
    try {
      // Submit the data first
      onSubmit(cleanData);
      // Then close the dialog
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit" : "Add"} Geofence Location
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                type="text"
                pattern="-?\d+(\.\d+)?"
                placeholder="-6.2088"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                type="text"
                pattern="-?\d+(\.\d+)?"
                placeholder="106.8456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Radius (meters)</Label>
              <Input
                id="radius"
                name="radius"
                value={formData.radius}
                onChange={handleChange}
                required
                type="text"
                pattern="\d+"
                placeholder="100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {initialData ? "Update" : "Create"} Location
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
