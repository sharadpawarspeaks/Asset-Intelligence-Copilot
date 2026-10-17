import React from 'react';
import { VisualResponse } from '../../types';
import { StatusCard } from './StatusCard';
import { DataTable } from './DataTable';
import { LineChartVisual } from './LineChartVisual';
import { BarChartVisual } from './BarChartVisual';
import { HeatmapVisual } from './HeatmapVisual';
import { MapVisual } from './MapVisual';

interface Props {
  visual?: VisualResponse;
  onSelectWell?: (wellId: string) => void;
}

export const GenerativeVisual: React.FC<Props> = ({ visual, onSelectWell }) => {
  if (!visual || !visual.data) return null;

  switch (visual.type) {
    case 'status_card':
      return <StatusCard data={visual.data} onSelectWell={onSelectWell} />;
    case 'table':
      return <DataTable data={visual.data} onSelectWell={onSelectWell} />;
    case 'line_chart':
      return <LineChartVisual data={visual.data} />;
    case 'bar_chart':
      return <BarChartVisual data={visual.data} onSelectWell={onSelectWell} />;
    case 'map':
      return <MapVisual data={visual.data} onSelectWell={onSelectWell} />;
    case 'heatmap':
      return <HeatmapVisual data={visual.data} />;
    default:
      return null;
  }
};
