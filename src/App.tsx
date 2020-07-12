import React from "react";
import styles from "./App.module.scss";

import AppStore, { Repo, FSObject } from "./store";

import "mobx-react-lite/batchingForReactDom";
import { observer } from "mobx-react";

const Pagination = observer(({ store }: { store: AppStore }) => {
  const around = 2;

  const endAt = Math.min(
    store.page + Math.max(2 * around - store.page + 1, around),
    store.pagesCount
  );
  const startAt = Math.max(endAt - around * 2, 1);

  const pages = [];
  for (let page = startAt; page <= endAt; page++) {
    pages.push(page);
  }

  return (
    <div className={styles.pagination}>
      <button
        className={styles.page + " " + styles.pageLeft}
        onClick={() => store.firstPage()}
      >
        &laquo;
      </button>
      <button className={styles.page} onClick={() => store.prevPage()}>
        &lsaquo;
      </button>
      {pages.map((page) => (
        <button
          key={page}
          className={
            styles.page + (store.page === page ? " " + styles.current : "")
          }
          onClick={() => store.setPage(page)}
        >
          {page}
        </button>
      ))}
      <button className={styles.page} onClick={() => store.nextPage()}>
        &rsaquo;
      </button>
      <button
        className={styles.page + " " + styles.pageRight}
        onClick={() => store.lastPage()}
      >
        &raquo;
      </button>
    </div>
  );
});

const UserInput = observer(({ store }: { store: AppStore }) => {
  return (
    <input
      onChange={(e) => store.setUser(e.target.value)}
      value={store.user}
      placeholder="Username"
    />
  );
});

const QueryInput = observer(({ store }: { store: AppStore }) => {
  return (
    <input
      onChange={(e) => store.setQuery(e.target.value)}
      value={store.query}
      placeholder="Search query"
    />
  );
});

const DirView = observer(
  ({ content, repo }: { content: FSObject[]; repo: Repo }) => {
    return (
      <div className={styles.fs}>
        {content.map((obj) => (
          <div key={obj.id}>
            <button
              className={obj.type === "dir" ? styles.dir : styles.file}
              onClick={() => (obj.type === "dir" ? obj.expand() : null)}
            >
              {obj.name}
              {obj.type === "dir" ? "/" : ""}
            </button>
            {obj.childrenVisible ? (
              <DirView content={obj.children as FSObject[]} repo={repo} />
            ) : null}
          </div>
        ))}
      </div>
    );
  }
);

// Repo block
const RepoView = observer(({ repo }: { repo: Repo }) => {
  return (
    <div className={styles.repo}>
      <div className={styles.block1}>
        <div className={styles.repoName}>
          <a className={styles.link} href={repo.url}>
            {repo.name}
          </a>
          <span className={styles.language}> · {repo.language}</span>
        </div>
        <div className={styles.stats}>
          {repo.stars}{" "}
          <span role="img" aria-label="stars">
            ⭐
          </span>
        </div>
      </div>
      <div className={styles.description}>
        <span>{repo.description !== null ? repo.description : ""}</span>
      </div>
      <button
        className={
          styles.button + (repo.contentVisible ? " " + styles.open : "")
        }
        onClick={repo.loadContent.bind(repo)}
      >
        Files
      </button>

      {repo.contentVisible ? (
        <DirView content={repo.content} repo={repo} />
      ) : null}
    </div>
  );
});

// Root component
const App = observer(({ store }: { store: AppStore }) => {
  return (
    <div className={styles.mainWrap}>
      <div className={styles.main}>
        <Pagination store={store} />
        <div className={styles.inputs}>
          <UserInput store={store} />
          <QueryInput store={store} />
        </div>
        {store.error ? (
          <div className={styles.error}>{store.error}</div>
        ) : (
          <div>
            {store.repos.map((repo) => (
              <RepoView repo={repo} key={repo.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default App;
