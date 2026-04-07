// Project entity — main container for a user's landing page project

import { BriefData } from './brief';
import { StrategyData } from './strategy';
import { CopyData } from './copy';
import { ProjectStatus } from './chat';
import { SkeletonType } from './strategy';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  brief_data: BriefData;
  strategy_data: StrategyData;
  archetype: string | null;
  skeleton_type: SkeletonType;
  active_version: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectOutput {
  id: string;
  project_id: string;
  version: number;
  copy_data: CopyData;
  html_content: string;
  created_at: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  status: ProjectStatus;
  archetype: string | null;
  created_at: string;
  updated_at: string;
}
