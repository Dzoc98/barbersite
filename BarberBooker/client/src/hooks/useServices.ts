import { useQuery } from "@tanstack/react-query";
import { Service } from "@/types";

export const useServices = () => {
  // Fetch all services
  const { data, isLoading, error } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  return {
    data,
    isLoading,
    error,
  };
};
