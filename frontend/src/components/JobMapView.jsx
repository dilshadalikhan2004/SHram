import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { IndianRupee, MapPin, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

// Fix for Leaflet default icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const JobMapView = ({ jobs, onSelectJob }) => {
  // Default center (New Delhi or approximate center of India)
  const defaultCenter = [28.6139, 77.2090];
  
  // Calculate average position if jobs have coords
  const centers = jobs.filter(j => j.lat && j.lng);
  const center = centers.length > 0 
    ? [centers[0].lat, centers[0].lng] 
    : defaultCenter;

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative group">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {jobs.map((job) => (
          <Marker 
            key={job.id} 
            position={[job.lat || (defaultCenter[0] + (Math.random() - 0.5) * 0.1), job.lng || (defaultCenter[1] + (Math.random() - 0.5) * 0.1)]}
          >
            <Popup className="custom-popup">
              <div className="p-2 space-y-3 min-w-[200px] font-['Manrope']">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base leading-tight">{job.title}</h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                    {job.category}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
                  <MapPin className="w-3 h-3 text-primary" />
                  {job.location}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-muted/20">
                  <div className="flex items-center gap-1 text-primary font-black">
                    <IndianRupee className="w-3 h-3" />
                    <span>{job.salary_paise / 100}</span>
                    <span className="text-[10px] text-muted-foreground ml-0.5 capitalize">{job.salary_type}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 rounded-lg text-[10px] hover:bg-primary hover:text-white transition-all font-black uppercase"
                    onClick={() => onSelectJob(job)}
                  >
                    Details <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-6 right-6 z-20 bg-background/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary" /> Active Job Pins
          </div>
          <div className="text-[10px] text-muted-foreground/60 italic">
            Click pins to view briefing & details
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobMapView;
