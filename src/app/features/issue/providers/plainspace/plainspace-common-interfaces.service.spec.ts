import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PlainspaceCommonInterfacesService } from './plainspace-common-interfaces.service';
import { PlainspaceApiService } from './plainspace-api.service';
import { PlainspaceIssue } from './plainspace-issue.model';
import { IssueProviderService } from '../../issue-provider.service';
import { Task } from '../../../tasks/task.model';

describe('PlainspaceCommonInterfacesService', () => {
  let service: PlainspaceCommonInterfacesService;
  let api: PlainspaceApiService;

  const issue = (scheduledAt: string | null, isDone = false): PlainspaceIssue => ({
    id: 't1',
    title: 'Buy milk',
    isDone,
    updatedAt: '2026-01-02T00:00:00.000Z',
    url: 'https://plainspace.org/p/item/t1',
    projectId: 'space-1',
    scheduledAt,
    isRecurring: false,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlainspaceCommonInterfacesService,
        // extractSyncValues is pure, so the API stub is never called here.
        { provide: PlainspaceApiService, useValue: {} },
        { provide: IssueProviderService, useValue: {} },
      ],
    });
    service = TestBed.inject(PlainspaceCommonInterfacesService);
    api = TestBed.inject(PlainspaceApiService);
  });

  // Without a seeded baseline, computePushDecisions skips every push as
  // 'no-baseline', so the done + scheduled-time write-back never fires.
  it('getAddTaskData seeds the two-way-sync baseline (done + scheduledAt)', () => {
    const data = service.getAddTaskData(issue('2026-01-02T09:00:00.000Z', true));
    expect(data.title).toBe('Buy milk');
    expect(data.isDone).toBe(true);
    expect(data.issueLastSyncedValues).toEqual({
      isDone: true,
      title: 'Buy milk',
      scheduledAt: '2026-01-02T09:00:00.000Z',
    });
  });

  it('getAddTaskData baseline carries a null scheduledAt for unscheduled tasks', () => {
    const data = service.getAddTaskData(issue(null));
    expect(data.issueLastSyncedValues).toEqual({
      isDone: false,
      title: 'Buy milk',
      scheduledAt: null,
    });
  });

  it('getAddTaskData imports scheduledAt as dueWithTime (schedule shows in the app)', () => {
    const iso = '2026-01-02T09:00:00.000Z';
    const data = service.getAddTaskData(issue(iso));
    expect(data.dueWithTime).toBe(new Date(iso).getTime());
  });

  it('getAddTaskData leaves dueWithTime unset for unscheduled tasks', () => {
    const data = service.getAddTaskData(issue(null));
    expect('dueWithTime' in data).toBe(false);
  });

  describe('getFreshDataForIssueTask (poll pulls scheduledAt → dueWithTime)', () => {
    const stubCfg = (): void => {
      spyOn(
        service as unknown as { _getCfgOnce$: (id: string) => unknown },
        '_getCfgOnce$',
      ).and.returnValue(of({}));
    };
    const setRemote = (i: PlainspaceIssue): void => {
      (api as unknown as { getById$: () => unknown }).getById$ = () => of(i);
    };

    it('pulls dueWithTime when the remote task changed', async () => {
      setRemote(issue('2026-01-02T09:00:00.000Z'));
      stubCfg();
      const task = { issueProviderId: 'p1', issueId: 't1', issueLastUpdated: 0 } as Task;
      const res = await service.getFreshDataForIssueTask(task);
      expect(res?.taskChanges.dueWithTime).toBe(
        new Date('2026-01-02T09:00:00.000Z').getTime(),
      );
      expect(res?.taskChanges.issueWasUpdated).toBe(true);
    });

    it('clears dueWithTime when the remote task was unscheduled', async () => {
      setRemote(issue(null));
      stubCfg();
      const task = { issueProviderId: 'p1', issueId: 't1', issueLastUpdated: 0 } as Task;
      const res = await service.getFreshDataForIssueTask(task);
      expect(res?.taskChanges.dueWithTime).toBeUndefined();
    });

    // Plainspace → SP completion sync: when a task is completed in Plainspace, the
    // poll must carry isDone:true into the task changes so SP marks it done.
    it('pulls isDone:true when the remote task was completed', async () => {
      setRemote(issue(null, true));
      stubCfg();
      const task = { issueProviderId: 'p1', issueId: 't1', issueLastUpdated: 0 } as Task;
      const res = await service.getFreshDataForIssueTask(task);
      expect(res?.taskChanges.isDone).toBe(true);
    });

    it('pulls isDone:false when the remote task was reopened', async () => {
      setRemote(issue(null, false));
      stubCfg();
      const task = { issueProviderId: 'p1', issueId: 't1', issueLastUpdated: 0 } as Task;
      const res = await service.getFreshDataForIssueTask(task);
      expect(res?.taskChanges.isDone).toBe(false);
    });

    it('returns null when the remote task is unchanged', async () => {
      setRemote(issue('2026-01-02T09:00:00.000Z'));
      stubCfg();
      const task = {
        issueProviderId: 'p1',
        issueId: 't1',
        issueLastUpdated: new Date('2026-01-02T00:00:00.000Z').getTime(),
      } as Task;
      expect(await service.getFreshDataForIssueTask(task)).toBeNull();
    });
  });

  describe('getFreshDataForIssueTasks (bulk poll = one fetch per provider)', () => {
    it('fetches all tasks once via getMyTasks$, not one getById per task', async () => {
      spyOn(
        service as unknown as { _getCfgOnce$: (id: string) => unknown },
        '_getCfgOnce$',
      ).and.returnValue(of({}));
      const t1 = { ...issue('2026-01-02T09:00:00.000Z'), id: 't1' };
      const t2 = { ...issue('2026-01-03T09:00:00.000Z'), id: 't2' };
      const getMyTasks$ = jasmine.createSpy('getMyTasks$').and.returnValue(of([t1, t2]));
      const getById$ = jasmine.createSpy('getById$');
      (api as unknown as { getMyTasks$: unknown }).getMyTasks$ = getMyTasks$;
      (api as unknown as { getById$: unknown }).getById$ = getById$;

      const tasks = [
        { issueProviderId: 'p1', issueId: 't1', issueLastUpdated: 0 },
        { issueProviderId: 'p1', issueId: 't2', issueLastUpdated: 0 },
      ] as Task[];
      const updates = await service.getFreshDataForIssueTasks(tasks);

      expect(getMyTasks$).toHaveBeenCalledTimes(1);
      expect(getById$).not.toHaveBeenCalled();
      expect(updates.map((u) => u.task.issueId)).toEqual(['t1', 't2']);
    });

    it('skips tasks that are no longer returned (e.g. unassigned from me)', async () => {
      spyOn(
        service as unknown as { _getCfgOnce$: (id: string) => unknown },
        '_getCfgOnce$',
      ).and.returnValue(of({}));
      (api as unknown as { getMyTasks$: unknown }).getMyTasks$ = () =>
        of([{ ...issue('2026-01-02T09:00:00.000Z'), id: 't1' }]);
      const tasks = [
        { issueProviderId: 'p1', issueId: 't1', issueLastUpdated: 0 },
        { issueProviderId: 'p1', issueId: 'gone', issueLastUpdated: 0 },
      ] as Task[];
      const updates = await service.getFreshDataForIssueTasks(tasks);
      expect(updates.map((u) => u.task.issueId)).toEqual(['t1']);
    });

    // Plainspace → SP completion sync via the bulk poll path (the one the
    // auto-poll actually uses): a remotely-completed task must carry isDone:true.
    it('carries isDone:true for a task completed remotely', async () => {
      spyOn(
        service as unknown as { _getCfgOnce$: (id: string) => unknown },
        '_getCfgOnce$',
      ).and.returnValue(of({}));
      (api as unknown as { getMyTasks$: unknown }).getMyTasks$ = () =>
        of([{ ...issue(null, true), id: 't1' }]);
      const tasks = [
        { issueProviderId: 'p1', issueId: 't1', issueLastUpdated: 0 },
      ] as Task[];
      const updates = await service.getFreshDataForIssueTasks(tasks);
      expect(updates[0]?.taskChanges.isDone).toBe(true);
    });
  });

  describe('getRemovedRemoteTasks (orphan detection by list-diff)', () => {
    const setMyTasks = (ids: string[]): void => {
      spyOn(
        service as unknown as { _getCfgOnce$: (id: string) => unknown },
        '_getCfgOnce$',
      ).and.returnValue(of({}));
      (api as unknown as { getMyTasks$: unknown }).getMyTasks$ = () =>
        of(ids.map((id) => ({ ...issue(null), id })));
    };

    it('returns tasks missing from my task list (deleted or reassigned away)', async () => {
      setMyTasks(['kept']);
      const tasks = [
        { issueProviderId: 'p1', issueId: 'kept', issueLastUpdated: 0 },
        { issueProviderId: 'p1', issueId: 'gone', issueLastUpdated: 0 },
      ] as Task[];
      const removed = await service.getRemovedRemoteTasks(tasks);
      expect(removed.map((t) => t.issueId)).toEqual(['gone']);
    });

    it('keeps tasks still in my list (done tasks stay in the list)', async () => {
      setMyTasks(['a', 'b']);
      const tasks = [
        { issueProviderId: 'p1', issueId: 'a', issueLastUpdated: 0 },
        { issueProviderId: 'p1', issueId: 'b', issueLastUpdated: 0 },
      ] as Task[];
      expect(await service.getRemovedRemoteTasks(tasks)).toEqual([]);
    });

    // Critical data-loss guard: getMyTasks$ returns [] both on a fail-soft error
    // (offline / bad token / wholesale 404) AND when the caller's membership
    // scope is empty (removed from the space). An empty list must NOT be read as
    // "everything removed" — else losing access wipes every task fleet-wide.
    it('never removes anything when my task list is empty', async () => {
      setMyTasks([]);
      const tasks = [
        { issueProviderId: 'p1', issueId: 'a', issueLastUpdated: 0 },
        { issueProviderId: 'p1', issueId: 'b', issueLastUpdated: 0 },
      ] as Task[];
      expect(await service.getRemovedRemoteTasks(tasks)).toEqual([]);
    });

    // Generalised gate: a NON-empty list that contains none of my tasks (wrong
    // space / garbage / total churn) is just as untrustworthy as an empty one.
    it('never removes when the list shares no ids with my tasks', async () => {
      setMyTasks(['someone-elses-task']);
      const tasks = [
        { issueProviderId: 'p1', issueId: 'a', issueLastUpdated: 0 },
        { issueProviderId: 'p1', issueId: 'b', issueLastUpdated: 0 },
      ] as Task[];
      expect(await service.getRemovedRemoteTasks(tasks)).toEqual([]);
    });
  });
});
