import { Link } from "wouter";
import { Scissors } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Scissors className="text-primary h-5 w-5" />
              </div>
              <span className="font-heading text-xl font-bold">BarberStyle</span>
            </div>
            <p className="text-slate-300 max-w-md">
              Prenota il tuo appuntamento con il barbiere in pochi semplici passi. Servizio professionale con i migliori prodotti.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-accent text-lg mb-4">CONTATTI</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Via Roma 123, Milano</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-phone"></i>
                  <span>+39 02 1234567</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-envelope"></i>
                  <span>info@barberstyle.it</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-accent text-lg mb-4">ORARI</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex justify-between">
                  <span>Lun - Ven:</span>
                  <span>09:00 - 19:30</span>
                </li>
                <li className="flex justify-between">
                  <span>Sabato:</span>
                  <span>09:00 - 18:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Domenica:</span>
                  <span>Chiuso</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-accent text-lg mb-4">SEGUICI</h3>
              <div className="flex gap-4">
                <Link href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent transition-colors">
                  <i className="fab fa-facebook-f"></i>
                </Link>
                <Link href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent transition-colors">
                  <i className="fab fa-instagram"></i>
                </Link>
                <Link href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent transition-colors">
                  <i className="fab fa-whatsapp"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} BarberStyle. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
