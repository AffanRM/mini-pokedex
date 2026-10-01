import { AsyncStateModel } from '../../common/models/async-state.model';
import { CreateTeamModel, TeamModel } from './team.model';

export type TeamMutationErrorModel =
  | { readonly operation: 'create'; readonly message: string; readonly input: CreateTeamModel }
  | { readonly operation: 'delete'; readonly message: string; readonly teamId: string };

export interface TeamStateModel extends AsyncStateModel<readonly TeamModel[]> {
  readonly pendingIds: readonly string[];
  readonly mutationError: TeamMutationErrorModel | null;
}
