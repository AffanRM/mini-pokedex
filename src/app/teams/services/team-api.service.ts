import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TEAM_API_URL } from '../../common/constants/api.constants';
import { ApiError, GraphqlService } from '../../core/graphql.service';
import { CreateTeamModel, TeamModel, TeamResponseModel } from '../models/team.model';
import { CREATE_TEAM_MUTATION, REMOVE_TEAM_MUTATION, TEAMS_QUERY } from './team.queries';

function mapTeam(team: TeamResponseModel): TeamModel {
  return {
    id: String(team.id),
    trainerId: String(team.trainer_id),
    name: team.name,
    pokemonIds: team.pokemon_ids,
    createdAt: team.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly graphql = inject(GraphqlService);

  /** Fetch teams from the assessment's local mock server. */
  getTeams$(): Observable<readonly TeamModel[]> {
    return this.graphql
      .request$<{ allTeams: readonly TeamResponseModel[] }>(TEAM_API_URL, TEAMS_QUERY)
      .pipe(map((data) => data.allTeams.map(mapTeam)));
  }

  /** Create one team. Mutations are deliberately never automatically retried. */
  createTeam$(input: CreateTeamModel): Observable<TeamModel> {
    return this.graphql
      .request$<{ createTeam: TeamResponseModel | null }>(TEAM_API_URL, CREATE_TEAM_MUTATION, {
        ...input,
      })
      .pipe(
        map((data) => {
          if (!data.createTeam)
            throw new ApiError('The team could not be saved. Please try again.');
          return mapTeam(data.createTeam);
        }),
      );
  }

  /** Remove a team by its server ID; missing records are treated as already deleted. */
  deleteTeam$(id: string): Observable<void> {
    return this.graphql
      .request$<{ removeTeam: { id: string } | null }>(TEAM_API_URL, REMOVE_TEAM_MUTATION, { id })
      .pipe(map(() => undefined));
  }
}
