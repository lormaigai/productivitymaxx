import {
  IssueData,
  IssueDataReduced,
  IssueIntegrationCfg,
  SearchResultItem,
} from './issue.model';
import { IssueTask, Task } from '../tasks/task.model';
import { TaskAttachment } from '../tasks/task-attachment/task-attachment.model';

export interface IssueServiceInterface {
  // MANDATORY
  // ---------
  isEnabled(cfg: IssueIntegrationCfg): boolean;

  testConnection(cfg: IssueIntegrationCfg): Promise<boolean>;

  pollInterval: number; // 0 means no polling

  issueLink(issueId: string | number, issueProviderId: string): Promise<string>;

  getById(id: string | number, issueProviderId: string): Promise<IssueData | null>;

  getAddTaskData(issueData: IssueDataReduced): IssueTask;

  searchIssues(searchTerm: string, issueProviderId: string): Promise<SearchResultItem[]>;

  // also used to determine if task is done
  getFreshDataForIssueTask(task: Task): Promise<{
    taskChanges: Partial<Task>;
    issue: IssueData;
    issueTitle: string;
  } | null>;

  getFreshDataForIssueTasks(tasks: Task[]): Promise<
    {
      task: Task;
      taskChanges: Partial<Task>;
      issue: IssueData;
    }[]
  >;

  // OPTIONAL
  // --------

  /**
   * Returns the subset of the given imported tasks that are no longer present
   * for this user on the provider (deleted, or reassigned away). The caller
   * decides whether and how to remove them locally. Implementations MUST NOT act
   * on an inconclusive fetch — an outage or lost access must never look like a
   * mass removal.
   */
  getRemovedRemoteTasks?(tasks: Task[]): Promise<Task[]>;

  getMappedAttachments?(issueData: IssueData): TaskAttachment[];

  getNewIssuesToAddToBacklog?(
    issueProviderId: string,
    allExistingIssueIds: number[] | string[],
  ): Promise<IssueDataReduced[]>;

  getSubTasks?(
    issueId: string | number,
    issueProviderId: string,
    issue: IssueDataReduced,
  ): Promise<IssueDataReduced[]>;

  // TODO could be called when task is updated from issue, whenever task is updated
  updateIssueFromTask?(task: Task): Promise<void>;
}
