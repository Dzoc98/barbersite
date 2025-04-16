import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { useAppointments } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Service } from "@/types";
import { format, addDays, isBefore, isAfter, isSameDay, parse, setHours, setMinutes } from "date-fns";
import { it } from "date-fns/locale";

// Steps in the booking flow
enum BookingStep {
  SERVICE = 1,
  DATE = 2,
  TIME = 3,
  CONFIRM = 4,
}

const BookingFlow = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.SERVICE);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: services, isLoading: servicesLoading } = useServices();
  const { createAppointment } = useAppointments(user?.id);

  // Get days in current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days array
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    // Convert to Monday as first day of week (0 = Monday, 6 = Sunday)
    const firstDayOfWeek = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const days = [];
    
    // Add previous month days
    const prevMonthDays = firstDayOfWeek;
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    for (let i = daysInPrevMonth - prevMonthDays + 1; i <= daysInPrevMonth; i++) {
      days.push({
        day: i,
        month: month - 1,
        year,
        isCurrentMonth: false,
        isDisabled: true,
      });
    }
    
    // Add current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
        isDisabled: isBefore(date, today) && !isSameDay(date, today),
        date,
      });
    }
    
    // Add next month days to fill the last row
    const totalDaysToShow = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;
    const nextMonthDays = totalDaysToShow - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        day: i,
        month: month + 1,
        year,
        isCurrentMonth: false,
        isDisabled: true,
      });
    }
    
    return days;
  };

  // Get time slots for selected date
  const getTimeSlots = async () => {
    if (!selectedDate || !selectedService) return;
    
    try {
      const response = await fetch(`/api/available-slots?date=${selectedDate.toISOString()}&serviceId=${selectedService.id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }
      
      const data = await response.json();
      setAvailableTimeSlots(data.availableSlots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare gli orari disponibili. Riprova più tardi.',
        variant: 'destructive',
      });
      setAvailableTimeSlots([]);
    }
  };

  useEffect(() => {
    if (selectedDate && selectedService) {
      getTimeSlots();
    }
  }, [selectedDate, selectedService]);

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Navigate between steps
  const goToNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const goToPrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Format time from ISO string to HH:MM
  const formatTime = (isoString: string) => {
    return format(new Date(isoString), 'HH:mm');
  };

  // Format price in Euro
  const formatPrice = (priceInCents: number) => {
    return `€${(priceInCents / 100).toFixed(2)}`;
  };

  // Confirm and create appointment
  const confirmAppointment = async () => {
    if (!user || !selectedService || !selectedDate || !selectedTime) {
      toast({
        title: 'Errore',
        description: 'Dati mancanti per completare la prenotazione.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse selected time and combine with selected date
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);

      await createAppointment({
        userId: user.id,
        serviceId: selectedService.id,
        appointmentDate: appointmentDate.toISOString(),
      });

      toast({
        title: 'Prenotazione confermata',
        description: 'La tua prenotazione è stata confermata con successo! Riceverai un promemoria su WhatsApp 24 ore prima dell\'appuntamento.',
      });

      navigate('/');
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile completare la prenotazione. Riprova più tardi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate calendar days
  const calendarDays = generateCalendarDays();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Booking Steps */}
        <div className="flex mb-8 border-b border-slate-200">
          <div className={`flex-1 pb-3 text-center ${currentStep >= BookingStep.SERVICE ? 'border-b-2 border-accent' : 'text-slate-500'}`}>
            <span className={`inline-flex items-center justify-center w-6 h-6 ${currentStep >= BookingStep.SERVICE ? 'bg-accent text-white' : 'bg-slate-200 text-slate-700'} rounded-full text-sm font-medium mr-2`}>1</span>
            <span className={currentStep >= BookingStep.SERVICE ? 'font-medium' : ''}>Servizio</span>
          </div>
          <div className={`flex-1 pb-3 text-center ${currentStep >= BookingStep.DATE ? 'border-b-2 border-accent' : 'text-slate-500'}`}>
            <span className={`inline-flex items-center justify-center w-6 h-6 ${currentStep >= BookingStep.DATE ? 'bg-accent text-white' : 'bg-slate-200 text-slate-700'} rounded-full text-sm font-medium mr-2`}>2</span>
            <span className={currentStep >= BookingStep.DATE ? 'font-medium' : ''}>Data</span>
          </div>
          <div className={`flex-1 pb-3 text-center ${currentStep >= BookingStep.TIME ? 'border-b-2 border-accent' : 'text-slate-500'}`}>
            <span className={`inline-flex items-center justify-center w-6 h-6 ${currentStep >= BookingStep.TIME ? 'bg-accent text-white' : 'bg-slate-200 text-slate-700'} rounded-full text-sm font-medium mr-2`}>3</span>
            <span className={currentStep >= BookingStep.TIME ? 'font-medium' : ''}>Orario</span>
          </div>
          <div className={`flex-1 pb-3 text-center ${currentStep >= BookingStep.CONFIRM ? 'border-b-2 border-accent' : 'text-slate-500'}`}>
            <span className={`inline-flex items-center justify-center w-6 h-6 ${currentStep >= BookingStep.CONFIRM ? 'bg-accent text-white' : 'bg-slate-200 text-slate-700'} rounded-full text-sm font-medium mr-2`}>4</span>
            <span className={currentStep >= BookingStep.CONFIRM ? 'font-medium' : ''}>Conferma</span>
          </div>
        </div>
        
        {/* Step 1: Service Selection */}
        <Card className={currentStep === BookingStep.SERVICE ? "" : "hidden"}>
          <CardContent className="p-6">
            <h2 className="font-heading text-2xl font-bold mb-6">Scegli il servizio</h2>
            
            {servicesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services?.map((service) => (
                  <div 
                    key={service.id} 
                    className={`border rounded-lg p-4 hover:border-accent cursor-pointer transition-colors ${selectedService?.id === service.id ? 'border-accent' : 'border-slate-200'}`}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{service.name}</h3>
                      <span className="text-accent font-medium">{formatPrice(service.price)}</span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1 mb-3">{service.description}</p>
                    <div className="flex items-center text-sm text-slate-500">
                      <i className="far fa-clock mr-1"></i>
                      <span>{service.durationMinutes} minuti</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <Button 
                onClick={goToNextStep}
                className="px-6 py-2 bg-accent hover:bg-accent-dark font-accent"
                disabled={!selectedService}
              >
                CONTINUA
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Step 2: Date Selection */}
        <Card className={currentStep === BookingStep.DATE ? "" : "hidden"}>
          <CardContent className="p-6">
            <h2 className="font-heading text-2xl font-bold mb-6">Scegli la data</h2>
            
            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={prevMonth}
              >
                <i className="fas fa-chevron-left"></i>
              </Button>
              <h3 className="font-accent text-xl">
                {format(currentMonth, 'MMMM yyyy', { locale: it }).toUpperCase()}
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextMonth}
              >
                <i className="fas fa-chevron-right"></i>
              </Button>
            </div>
            
            {/* Calendar */}
            <div className="mb-6">
              {/* Days of week */}
              <div className="grid grid-cols-7 mb-2">
                <div className="text-center text-slate-500 font-medium">LUN</div>
                <div className="text-center text-slate-500 font-medium">MAR</div>
                <div className="text-center text-slate-500 font-medium">MER</div>
                <div className="text-center text-slate-500 font-medium">GIO</div>
                <div className="text-center text-slate-500 font-medium">VEN</div>
                <div className="text-center text-slate-500 font-medium">SAB</div>
                <div className="text-center text-slate-500 font-medium">DOM</div>
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`calendar-day h-12 flex items-center justify-center rounded-lg 
                      ${day.isDisabled ? 'day-disabled' : 'border border-slate-200 cursor-pointer'} 
                      ${selectedDate && day.date && isSameDay(selectedDate, day.date) ? 'day-selected' : ''}
                    `}
                    onClick={() => day.date && !day.isDisabled && handleDateSelect(day.date)}
                  >
                    {day.day}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                onClick={goToPrevStep}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded font-accent hover:bg-slate-50 transition-colors"
              >
                INDIETRO
              </Button>
              <Button 
                onClick={goToNextStep}
                className="px-6 py-2 bg-accent text-white rounded font-accent hover:bg-accent-dark transition-colors"
                disabled={!selectedDate}
              >
                CONTINUA
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Step 3: Time Selection */}
        <Card className={currentStep === BookingStep.TIME ? "" : "hidden"}>
          <CardContent className="p-6">
            <h2 className="font-heading text-2xl font-bold mb-6">Scegli l'orario</h2>
            
            <div className="mb-6">
              <div className="p-3 bg-slate-50 rounded-lg flex items-center mb-4">
                <i className="far fa-calendar-alt text-primary mr-2"></i>
                <span className="font-medium">
                  {selectedDate && format(selectedDate, "EEEE, d MMMM yyyy", { locale: it })}
                </span>
                <Button variant="link" className="ml-auto text-sm text-accent" onClick={goToPrevStep}>
                  Cambia
                </Button>
              </div>
              
              <h3 className="font-medium text-slate-700 mb-3">Orari disponibili:</h3>
              
              {availableTimeSlots.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <i className="far fa-clock text-4xl mb-2"></i>
                  <p>Nessun orario disponibile per la data selezionata</p>
                  <Button 
                    variant="link" 
                    className="text-accent mt-2"
                    onClick={goToPrevStep}
                  >
                    Seleziona un'altra data
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableTimeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`time-slot border rounded-lg py-2 px-1 text-center cursor-pointer 
                        ${selectedTime === formatTime(slot) ? 'slot-selected' : 'border-slate-200 hover:border-accent'}
                      `}
                      onClick={() => handleTimeSelect(formatTime(slot))}
                    >
                      {formatTime(slot)}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                onClick={goToPrevStep}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded font-accent hover:bg-slate-50 transition-colors"
              >
                INDIETRO
              </Button>
              <Button 
                onClick={goToNextStep}
                className="px-6 py-2 bg-accent text-white rounded font-accent hover:bg-accent-dark transition-colors"
                disabled={!selectedTime}
              >
                CONTINUA
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Step 4: Confirmation */}
        <Card className={currentStep === BookingStep.CONFIRM ? "" : "hidden"}>
          <CardContent className="p-6">
            <h2 className="font-heading text-2xl font-bold mb-6">Conferma prenotazione</h2>
            
            <div className="bg-slate-50 rounded-lg p-5 mb-6">
              <h3 className="font-semibold text-lg mb-4">Riepilogo dell'appuntamento</h3>
              
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-28 text-slate-500">Servizio:</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500">Data:</span>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, "EEEE, d MMMM yyyy", { locale: it })}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500">Orario:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500">Durata:</span>
                  <span className="font-medium">{selectedService?.durationMinutes} minuti</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500">Prezzo:</span>
                  <span className="font-medium text-accent">
                    {selectedService && formatPrice(selectedService.price)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-1"></i>
                <div>
                  <p className="text-sm text-slate-700">Riceverai un promemoria su WhatsApp 24 ore prima dell'appuntamento.</p>
                  <p className="text-sm text-slate-700 mt-1">Puoi cancellare la prenotazione fino a 2 ore prima senza costi.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                onClick={goToPrevStep}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded font-accent hover:bg-slate-50 transition-colors"
                disabled={isSubmitting}
              >
                INDIETRO
              </Button>
              <Button 
                onClick={confirmAppointment}
                className="px-6 py-2 bg-accent text-white rounded font-accent hover:bg-accent-dark transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>PRENOTAZIONE IN CORSO...</span>
                  </div>
                ) : (
                  "CONFERMA PRENOTAZIONE"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingFlow;
