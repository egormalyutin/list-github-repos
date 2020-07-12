import { observable, action, reaction, configure, flow } from "mobx";
import axios from "axios";

function debounce<T extends Array<any>>(
  fn: (...args: T) => void,
  wait: number
): (...args: T) => void {
  let timeout: number;

  return function (...args: T): void {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

const TOKEN = "d8166cb2cd56848803ac4430a588d005b7bc52ee";
const PAGE = 10;

async function getRepoContent(repo: Repo, path: string): Promise<FSObject[]> {
  const res = await axios.get(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${path}`,
    {
      params: {},
      headers: {
        Authorization: "token " + TOKEN,
      },
    }
  );

  return res.data.map((fs: any) => new FSObject(fs, repo));
}

export class FSObject {
  id: string = "";
  name: string = "";
  path: string = "";
  type: "file" | "dir" = "file";

  repo: Repo;
  @observable children?: FSObject[];
  @observable childrenVisible: boolean = false;

  constructor(fs: any, repo: Repo) {
    this.id = fs.git_url;
    this.name = fs.name;
    this.path = fs.path;
    this.type = fs.type === "dir" ? "dir" : "file";
    this.repo = repo;
  }

  expand = flow(
    function* (this: FSObject) {
      if (!this.children) {
        this.children = yield getRepoContent(this.repo, this.path);
      }
      this.childrenVisible = !this.childrenVisible;
    }.bind(this)
  );
}

export class Repo {
  id: number = 0;
  name: string = "";
  owner: string = "";
  description: string = "";
  url: string = "";
  language: string = "";
  stars: number = 0;
  watchers: number = 0;

  @observable contentVisible: boolean = false;
  @observable contentLoaded: boolean = false;
  @observable content: any[] = [];

  constructor(repo: any) {
    this.id = repo.id;
    this.name = repo.name;
    this.owner = repo.owner.login;
    this.description = repo.description;
    this.url = repo.html_url;
    this.language = repo.language;
    this.stars = repo.stargazers_count;
  }

  loadContent = flow(
    function* (this: Repo) {
      if (!this.contentLoaded) {
        this.content = yield getRepoContent(this, "");
        this.contentLoaded = true;
      }
      this.contentVisible = !this.contentVisible;
    }.bind(this)
  );
}

async function getUserRepos(
  user: string,
  page: number,
  query: string
): Promise<[Repo[], number]> {
  const res = await axios.get(`https://api.github.com/search/repositories`, {
    params: {
      q: `user:${user} ${query}`,
      sort: "stars",
      per_page: PAGE,
      page: page,
      affiliation: "owner",
    },
    headers: {
      Authorization: "token " + TOKEN,
    },
  });

  return [
    res.data.items.map((repo: any) => new Repo(repo)),
    Math.ceil(res.data.total_count / PAGE),
  ];
}

configure({ enforceActions: "always" });

// https://github.com/shinnn/github-username-regex/blob/master/index.js
function validateGithubUsername(username: string): boolean {
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username);
}

export default class AppStore {
  @observable user: string = "egormalyutin";
  @observable page: number = 1;
  @observable pagesCount: number = 1;
  @observable query: string = "";
  @observable error?: string = "";

  @observable.shallow repos: Repo[] = [];

  loadRepos = flow(
    function* (this: AppStore) {
      if (!validateGithubUsername(this.user)) {
        return;
      }

      this.error = "";

      try {
        [this.repos, this.pagesCount] = yield getUserRepos(
          this.user,
          this.page,
          this.query
        );
      } catch (e) {
        this.error = `Error: failed to get repos of user "${this.user}"`;
      }
    }.bind(this)
  );

  constructor() {
    this.loadRepos();

    reaction(() => [this.user, this.query], debounce(this.loadRepos, 500));
    reaction(() => [this.page], this.loadRepos);
  }

  // ACTIONS

  @action setPage(page: number) {
    this.page = page;
  }

  @action nextPage() {
    this.page = Math.min(this.pagesCount, this.page + 1);
  }

  @action prevPage() {
    this.page = Math.max(1, this.page - 1);
  }

  @action firstPage() {
    this.page = 1;
  }

  @action lastPage() {
    this.page = this.pagesCount;
  }

  @action setUser(user: string) {
    this.user = user;
  }

  @action setQuery(query: string) {
    this.query = query;
  }
}
