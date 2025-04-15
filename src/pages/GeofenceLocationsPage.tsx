import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, RefreshCw, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GeofenceLocationDialog, {
  GeofenceLocationData,
} from "@/components/settings/GeofenceLocationDialog";

const GeofenceLocationsPage = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocation, setCurrentLocation] =
    useState<GeofenceLocationData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      console.log("Fetching locations...");
      const { data, error } = await supabase
        .from("geofence_locations")
        .select("*")
        .order("name");

      if (error) throw error;
      console.log("Fetched locations:", data);
      setLocations(data || []);
    } catch (error: any) {
      console.error("Error fetching geofence locations:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();

    // Set up realtime subscription
    const subscription = supabase
      .channel("geofence-locations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "geofence_locations" },
        fetchLocations,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleAddLocation = () => {
    setCurrentLocation(null);
    setIsEditing(false);
    setShowDialog(true);
  };

  const handleEditLocation = (location: any) => {
    console.log("Editing location:", location);
    setCurrentLocation({
      id: location.id,
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius.toString(),
      description: location.description || "",
    });
    setIsEditing(true);
    setShowDialog(true);
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      // First check if this location is used by any employees
      const { data: employees, error: checkError } = await supabase
        .from("employees")
        .select("id")
        .eq("geofence_id", id);

      if (checkError) throw checkError;

      if (employees && employees.length > 0) {
        toast({
          title: "Cannot Delete",
          description: `This location is assigned to ${employees.length} employee(s). Please reassign them first.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("geofence_locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location deleted successfully",
      });

      fetchLocations();
    } catch (error: any) {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitLocation = async (data: GeofenceLocationData) => {
    try {
      if (isEditing && currentLocation?.id) {
        // Update existing location

        // Validate data before sending to Supabase
        const latitude = parseFloat(data.latitude);
        const longitude = parseFloat(data.longitude);
        const radius = parseInt(data.radius);

        if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
          throw new Error(
            "Invalid coordinates or radius. Please enter valid numbers.",
          );
        }

        console.log("Updating location with ID:", currentLocation.id);
        console.log("Update data:", {
          name: data.name,
          latitude,
          longitude,
          radius,
          description: data.description || null,
        });

        // Try a simpler update approach with just essential fields
        const { data: updateData, error } = await supabase
          .from("geofence_locations")
          .update({
            name: data.name,
            latitude: latitude,
            longitude: longitude,
            radius: radius,
            description: data.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentLocation.id)
          .select("*");

        if (error) console.log("Update error:", error);

        if (error) throw error;

        console.log("Updated data from server:", updateData);

        // Always force a refetch to ensure we have the latest data
        console.log("Forcing refetch after update");
        fetchLocations();

        toast({
          title: "Success",
          description: "Location updated successfully",
        });
      } else {
        // Create new location
        // Validate data before sending to Supabase
        const latitude = parseFloat(data.latitude);
        const longitude = parseFloat(data.longitude);
        const radius = parseInt(data.radius);

        if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
          throw new Error(
            "Invalid coordinates or radius. Please enter valid numbers.",
          );
        }

        // Create insert payload without any undefined fields
        const insertPayload: Record<string, any> = {};

        if (data.name) insertPayload.name = data.name;
        if (!isNaN(latitude)) insertPayload.latitude = latitude;
        if (!isNaN(longitude)) insertPayload.longitude = longitude;
        if (!isNaN(radius)) insertPayload.radius = radius;
        // Only include description if it's not undefined
        if (data.description !== undefined)
          insertPayload.description = data.description;
        insertPayload.created_at = new Date().toISOString();
        insertPayload.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from("geofence_locations")
          .insert(insertPayload);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Location added successfully",
        });
      }

      // Close the dialog after successful submission
      setShowDialog(false);
      // Always fetch the latest data
      fetchLocations();
    } catch (error: any) {
      console.error("Error saving location:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Geofence Locations
            </h1>
            <Button onClick={handleAddLocation}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Manage Geofence Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No geofence locations found. Add your first location to get
                  started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Radius (m)</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">
                          {location.name}
                        </TableCell>
                        <TableCell>{location.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-red-500" />
                            {typeof location.latitude === "number"
                              ? location.latitude.toFixed(6)
                              : location.latitude}
                            ,{" "}
                            {typeof location.longitude === "number"
                              ? location.longitude.toFixed(6)
                              : location.longitude}
                          </div>
                        </TableCell>
                        <TableCell>{location.radius}m</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {location.created_at
                            ? new Date(location.created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditLocation(location)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteLocation(location.id)
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Geofence Location Dialog */}
      {showDialog && (
        <GeofenceLocationDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onSubmit={handleSubmitLocation}
          initialData={currentLocation || undefined}
        />
      )}
    </DashboardLayout>
  );
};

export default GeofenceLocationsPage;
