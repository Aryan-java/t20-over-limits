import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Droplets,
  CircleDot,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Waves
} from "lucide-react";
import { MatchConditions, ConditionModifiers, WEATHER_ICONS, PITCH_ICONS, WEATHER_DESCRIPTIONS, PITCH_DESCRIPTIONS } from "@/types/weather";
import { cn } from "@/lib/utils";

interface WeatherConditionsPanelProps {
  conditions: MatchConditions;
  modifiers: ConditionModifiers;
  compact?: boolean;
}

const WeatherConditionsPanel = ({ conditions, modifiers, compact = false }: WeatherConditionsPanelProps) => {
  const getWeatherIcon = () => {
    switch (conditions.weather) {
      case 'sunny': return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'overcast': return <Cloud className="h-5 w-5 text-gray-500" />;
      case 'partly-cloudy': return <Cloud className="h-5 w-5 text-gray-400" />;
      case 'drizzle': return <CloudRain className="h-5 w-5 text-blue-500" />;
      case 'windy': return <Wind className="h-5 w-5 text-cyan-500" />;
      case 'humid': return <Droplets className="h-5 w-5 text-blue-400" />;
      case 'dew': return <Sparkles className="h-5 w-5 text-indigo-400" />;
      default: return <Sun className="h-5 w-5" />;
    }
  };

  const getPitchColor = () => {
    switch (conditions.pitch) {
      case 'green': return 'text-green-500';
      case 'dry': return 'text-amber-600';
      case 'dusty': return 'text-orange-500';
      case 'flat': return 'text-gray-500';
      case 'cracked': return 'text-red-500';
      case 'damp': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getAdvantageIcon = (advantage: 'low' | 'medium' | 'high') => {
    switch (advantage) {
      case 'high': return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
      case 'low': return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
      default: return <Minus className="h-3.5 w-3.5 text-yellow-500" />;
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
        <Badge variant="outline" className="gap-1.5 bg-background/50">
          <span className="text-lg">{WEATHER_ICONS[conditions.weather]}</span>
          <span className="capitalize">{conditions.weather.replace('-', ' ')}</span>
        </Badge>
        <Badge variant="outline" className={cn("gap-1.5 bg-background/50", getPitchColor())}>
          <span className="text-lg">{PITCH_ICONS[conditions.pitch]}</span>
          <span className="capitalize">{conditions.pitch}</span>
        </Badge>
        <Badge variant="outline" className="gap-1 bg-background/50">
          <Thermometer className="h-3 w-3" />
          {conditions.temperature}°C
        </Badge>
        <Badge variant="outline" className="gap-1 bg-background/50">
          <Droplets className="h-3 w-3" />
          {conditions.humidity}%
        </Badge>
        {conditions.dewFactor > 50 && (
          <Badge className="gap-1 bg-indigo-500/20 text-indigo-600 border-indigo-500/30">
            <Sparkles className="h-3 w-3" />
            Dew: {conditions.dewFactor}%
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-sky-500/20">
            <Cloud className="h-4 w-4 text-sky-500" />
          </div>
          Match Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weather & Pitch Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Weather Card */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/5 border border-sky-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{WEATHER_ICONS[conditions.weather]}</span>
              <div>
                <div className="font-semibold capitalize text-sm">
                  {conditions.weather.replace('-', ' ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {WEATHER_DESCRIPTIONS[conditions.weather]}
                </div>
              </div>
            </div>
          </div>

          {/* Pitch Card */}
          <div className={cn(
            "p-3 rounded-xl border",
            conditions.pitch === 'green' && "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20",
            conditions.pitch === 'dry' && "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20",
            conditions.pitch === 'dusty' && "bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/20",
            conditions.pitch === 'flat' && "bg-gradient-to-br from-gray-500/10 to-slate-500/5 border-gray-500/20",
            conditions.pitch === 'cracked' && "bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/20",
            conditions.pitch === 'damp' && "bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{PITCH_ICONS[conditions.pitch]}</span>
              <div>
                <div className="font-semibold capitalize text-sm">
                  {conditions.pitch} Pitch
                </div>
                <div className="text-xs text-muted-foreground">
                  {PITCH_DESCRIPTIONS[conditions.pitch]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Thermometer className="h-4 w-4 mx-auto text-red-400 mb-1" />
            <div className="text-sm font-bold">{conditions.temperature}°C</div>
            <div className="text-[10px] text-muted-foreground">Temp</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Droplets className="h-4 w-4 mx-auto text-blue-400 mb-1" />
            <div className="text-sm font-bold">{conditions.humidity}%</div>
            <div className="text-[10px] text-muted-foreground">Humidity</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Wind className="h-4 w-4 mx-auto text-cyan-400 mb-1" />
            <div className="text-sm font-bold capitalize">{conditions.windSpeed}</div>
            <div className="text-[10px] text-muted-foreground">Wind</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Sparkles className="h-4 w-4 mx-auto text-indigo-400 mb-1" />
            <div className="text-sm font-bold">{conditions.dewFactor}%</div>
            <div className="text-[10px] text-muted-foreground">Dew</div>
          </div>
        </div>

        {/* Pitch Degradation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5" />
              Pitch Wear
            </span>
            <span className="font-medium">{Math.round(conditions.pitchDegradation)}%</span>
          </div>
          <Progress value={conditions.pitchDegradation} className="h-2" />
        </div>

        {/* Advantages */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <span className="text-xs text-muted-foreground">Batting</span>
            <div className="flex items-center gap-1">
              {getAdvantageIcon(modifiers.battingAdvantage)}
              <span className="text-xs font-medium capitalize">{modifiers.battingAdvantage}</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <span className="text-xs text-muted-foreground">Bowling</span>
            <Badge variant="outline" className="text-[10px] h-5 capitalize">
              {modifiers.bowlingAdvantage}
            </Badge>
          </div>
        </div>

        {/* Condition Notes */}
        {modifiers.conditionNotes.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Match Insights
            </div>
            <div className="space-y-1">
              {modifiers.conditionNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CircleDot className="h-3 w-3 mt-0.5 text-primary/60" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherConditionsPanel;
