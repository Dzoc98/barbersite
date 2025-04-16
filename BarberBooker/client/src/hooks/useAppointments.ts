import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Appointment, AppointmentCreation } from "@/types";
import { apiRequest } from "@/lib/queryClient";

export const useAppointments = (userId?: number) => {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch appointments (all or by userId)
  const { data, isLoading, error } = useQuery<Appointment[]>({
    queryKey: userId ? [`/api/appointments?userId=${userId}`] : ['/api/appointments'],
    enabled: userId !== undefined, // Only run if userId is provided
  });

  // Create a new appointment
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointment: AppointmentCreation) => {
      const response = await apiRequest('POST', '/api/appointments', appointment);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/appointments?userId=${userId}`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      }
    },
  });

  // Update an appointment
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number, [key: string]: any }) => {
      setIsUpdating(true);
      try {
        const response = await apiRequest('PUT', `/api/appointments/${id}`, updates);
        return response.json();
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/appointments?userId=${userId}`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      }
    },
  });

  // Delete an appointment
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsDeleting(true);
      try {
        await apiRequest('DELETE', `/api/appointments/${id}`, undefined);
      } finally {
        setIsDeleting(false);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/appointments?userId=${userId}`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      }
    },
  });

  return {
    data,
    isLoading,
    error,
    createAppointment: createAppointmentMutation.mutateAsync,
    updateAppointment: updateAppointmentMutation.mutateAsync,
    deleteAppointment: deleteAppointmentMutation.mutateAsync,
    isDeleting,
    isUpdating,
  };
};
