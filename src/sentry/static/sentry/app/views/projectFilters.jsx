import React from 'react';
import styled from 'styled-components';

import ApiMixin from '../mixins/apiMixin';
import IndicatorStore from '../stores/indicatorStore';
import LoadingError from '../components/loadingError';
import LoadingIndicator from '../components/loadingIndicator';
import Switch from '../components/switch';
import {t} from '../locale';
import marked from '../utils/marked';

const FilterSwitch = function(props) {
  return (
    <Switch size={props.size}
      isActive={props.data.active}
      toggle={function () {
        props.onToggle(props.data, !props.data.active);
      }} />
  );
};

FilterSwitch.propTypes = {
  data: React.PropTypes.object.isRequired,
  onToggle: React.PropTypes.func.isRequired,
  size: React.PropTypes.string.isRequired
};


const FilterRow = React.createClass({
  propTypes: {
    orgId: React.PropTypes.string.isRequired,
    projectId: React.PropTypes.string.isRequired,
    data: React.PropTypes.object.isRequired,
    onToggle: React.PropTypes.func.isRequired,
  },

  getInitialState() {
    return {
      loading: false,
      error: false,
    };
  },

  onToggleSubfilters(active) {
    this.props.onToggle(this.props.data.subFilters, active);
  },

  render() {
    let data = this.props.data;

    return (
      <div style={{borderTop: '1px solid #f2f3f4', padding: '20px 0 0'}}>
        <div className="row">
          <div className="col-md-9">
            <h5 style={{marginBottom: 10}}>{data.name}</h5>
            {data.description &&
              <small className="help-block" dangerouslySetInnerHTML={{
                __html: marked(data.description)
              }} />
            }
          </div>
          <div className="col-md-3 align-right" style={{paddingRight: '25px'}}>
            <FilterSwitch {...this.props} size="lg"/>
          </div>
        </div>
      </div>
    );
  }
});

const LEGACY_BROWSER_SUBFILTERS = [
  'ie8',
  'ie9'
];

const LegacyBrowserFilterRow = React.createClass({
  propTypes: {
    orgId: React.PropTypes.string.isRequired,
    projectId: React.PropTypes.string.isRequired,
    data: React.PropTypes.object.isRequired,
    onToggle: React.PropTypes.func.isRequired,
  },

  getInitialState() {
    return {
      loading: false,
      error: false,
      subfilters: this.props.data.active === true
        ? new Set(LEGACY_BROWSER_SUBFILTERS)
        : new Set(this.props.data.active)
    };
  },

  onToggleSubfilters(subfilter) {
    let {subfilters} = this.state;
    if (subfilters.has(subfilter)) {
      subfilters.delete(subfilter);
    } else {
      subfilters.add(subfilter);
    }
    this.props.onToggle(this.props.data, subfilters);
  },

  render() {
    let data = this.props.data;

    return (
      <div style={{borderTop: '1px solid #f2f3f4', padding: '20px 0 0'}}>
        <div className="row">
          <div className="col-md-9">
            <h5 style={{marginBottom: 10}}>{data.name}</h5>
            {data.description &&
              <small className="help-block" dangerouslySetInnerHTML={{
                __html: marked(data.description)
              }} />
            }
          </div>
          <div className="col-md-3 align-right" style={{paddingRight: '25px'}}>
            <FilterSwitch {...this.props} size="lg"/>
          </div>
        </div>

        <FilterGrid>
          <div>
            <a onClick={this.onToggleSubfilters.bind(this, true)}>All</a>|
            <a onClick={this.onToggleSubfilters.bind(this, false)}>None</a>
          </div>

          <FilterGridItem>
            <FilterGridIcon className="icon-internet-explorer"/>
            <h5>Internet Explorer</h5>
            <p className="help-block">Version 8 and lower</p>
            <Switch isActive={this.state.subfilters.has('ie8')} toggle={this.onToggleSubfilters.bind(this, 'ie8')} size="lg"/>
          </FilterGridItem>

          <FilterGridItem>
            <FilterGridIcon className="icon-internet-explorer"/>
            <h5>Internet Explorer</h5>
            <p className="help-block">Version 9 and lower</p>
            <Switch isActive={this.state.subfilters.has('ie9')} toggle={this.onToggleSubfilters.bind(this, 'ie9')} size="lg"/>
          </FilterGridItem>
        </FilterGrid>
      </div>
    );
  }
});

// TODO(ckj): Make this its own generic component at some point

const FilterGrid = styled.div`
  display: flex;
  margin-left: -5px;
  margin-right: -5px;
  margin-bottom: 20px;
`;

const FilterGridItem = styled.div`
  flex: 1;
  margin-left: 5px;
  margin-right: 5px;
  width: 25%;
  background: #F7F8F9;
  border-radius: 3px;
  position: relative;
  padding: 10px 65px 6px 58px;

  && h5 {
    font-size: 15px;
    margin: 0 0 2px;
  }

  && p {
    margin: 0;
  }

  && .switch {
    background: #fff;
    position: absolute;
    top: 17px;
    right: 12px;
  }
`;

const FilterGridIcon = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 38px;
  height: 38px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 38px 38px;
`;

const ProjectFilters = React.createClass({
  mixins: [ApiMixin],

  getInitialState() {
    return {
      loading: true,
      error: false,
      filterList: [],
    };
  },

  componentDidMount() {
    this.fetchData();
  },

  fetchData() {
    let {orgId, projectId} = this.props.params;
    this.api.request(`/projects/${orgId}/${projectId}/filters/`, {
      success: (data, textStatus, jqXHR) => {
        this.setState({
          error: false,
          loading: false,
          filterList: data
        });
      },
      error: () => {
        this.setState({
          error: true,
          loading: false
        });
      }
    });
  },

  onToggleFilter(filter, active) {
    if (this.state.loading)
      return;

    let loadingIndicator = IndicatorStore.add(t('Saving changes..'));
    let {orgId, projectId} = this.props.params;

    let endpoint = `/projects/${orgId}/${projectId}/filters/${filter.id}/`; // ?id=a&id=b

    let data;
    if (typeof active === 'boolean') {
      data = {active: active};
    } else {
      data = {subfilters: active};
    }
    this.api.request(endpoint, {
      method: 'PUT',
      data: data,
      success: (d, textStatus, jqXHR) => {
        let stateFilter = this.state.filterList.find(f => f.id === filter.id);
        stateFilter.active = active;

        this.setState({
          filterList: [...this.state.filterList]
        });
        IndicatorStore.remove(loadingIndicator);
      },
      error: () => {
        this.setState({
          error: true,
          loading: false
        });
        IndicatorStore.remove(loadingIndicator);
        IndicatorStore.add(t('Unable to save changes. Please try again.'), 'error');
      }
    });
  },

  renderBody() {
    let body;

    if (this.state.loading)
      body = this.renderLoading();
    else if (this.state.error)
      body = <LoadingError onRetry={this.fetchData} />;
    else
      body = this.renderResults();

    return body;
  },

  renderLoading() {
    return (
      <div className="box">
        <LoadingIndicator />
      </div>
    );
  },

  renderResults() {
    let {orgId, projectId} = this.props.params;

    // let topLevelFilters = this.state.filterList.filter(filter => {
    //   return filter.id.indexOf(':') === -1;
    // });

    // topLevelFilters.forEach(topLevelFilter => {
    //   let subFilters = this.state.filterList.filter(filter => {
    //     return filter.id.startsWith(topLevelFilter.id + ':');
    //   });
    //   topLevelFilter.subFilters = subFilters;
    // });

    return (
      <div>
        {this.state.filterList.map(filter => {
          let props = {
            key: filter.id,
            data: filter,
            orgId: orgId,
            projectId: projectId,
            onToggle: this.onToggleFilter
          };
          return filter.id === 'legacy-browsers'
            ? <LegacyBrowserFilterRow {...props}/>
            : <FilterRow {...props}/>;
        })}
      </div>
    );
  },

  render() {
    // TODO(dcramer): localize when language is final
    return (
      <div>
        <h1>{t('Inbound Data Filters')}</h1>
        <p>Filters allow you to prevent Sentry from storing events in certain situations. Filtered events are tracked separately from rate limits, and do not apply to any project quotas.</p>
        {this.renderBody()}
      </div>
    );
  }
});

export default ProjectFilters;
