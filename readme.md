<a name="readme-top"></a>

<br />
<div align="center">
  <a href="https://github.com/normalframework/gl36-demo">
    <img src="logo.png" alt="Logo" width="80">
  </a>

  <h3 align="center">Guideline 36 Plugin</h3>

  <p align="center">
    A Normal Framework plugin that implements ASHRAE Guideline 36 control sequences.
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About</a>
    </li>
    <li>
      <a href="#installation">Intallation</a>
    </li>
    <li><a href="#overview">Overview</a></li>
    <li><a href="#configuration">Configuration</a></li>
    <li><a href="#reference">Reference</a></li>
    <li><a href="#troubleshooting">Troubleshooting</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About

This plugin implements several of the control sequences described in Guideline 36. It can be customized to work in any Normal Framework installation. It also serves as an example for how to write additional sequences.

![Dashboard][dashboard-screenshot]

## Installation

To install, create a new application and use the Github git url of this repository.

![Install][install-screenshot]

## Overview

Each sequence is broken down into three separate hooks:

**Hook 1: Calculate requests for each zone**

This hook takes advantage of the ability of hooks the same logic on multiple equips. For each zone, logic is run to calculate how many requests that zone should send.

**Hook 2. Get sum of all requests for each AHU**

This hook simply adds up all the requests for each Air Handler and writes them to an Automation Variable for easy tracking.

**Hook 3: Reset logic based on total number of requests**

This hook implements Trim and Repond logic based on the total number of requests for each air handler. Group Variables can be used to customize the variables for each Air Handler. These Group Variables can be exposed using the Normal Bacnet server.

## Static Pressure Resets

**Hook 1: requests-static-pressure-5.6.8.2.js**

**Hook 2: reset-static-pressure-5.16.1.js**

**Hook 3: sp-trim-and-respond.js**

## Supply Air Temperature Resets

**Hook 1: requests-supply-air-temp-5.6.8.1.js**

**Hook 2: reset-supply-air-temp-5.16.2.js**

**Hook 3: sat-trim-and-respond.js**

## Configuration

Users should be able to use this app without many changes to the logic. However, there are certain areas that will need to be customized to meet the needs of your installation.

**Point Selection**

Depending on your data, you may need to change the points that are selected for each hook. This can be done in the Hook user interface:

![Point Selection Screenshot][point-selection-screenshot]

See [Point Selection Docs](https://docs.normal.dev/applications/hooks/#point-selection) for more information.

**Class Names**

You may need to customize the point selection classnames in your application, depending on how you have modeled your data.

[![Classnames Example Screenshot][classnames-screenshot]]

**Variables**

You may want to add or remove variables based on your aims. For instance, some variables in the Trim and Respond logic are exposed as variables so they can be controlled through another system. You may want to remove this and hardcode the values, or add other more variables.

## Troubleshooting

The Applications Framework offers several tools for troubleshooting applications.

**logEvent() method**

The `logEvent` method on the `sdk` object will log the message to stdout (which will show up in the integrated console) as well as the run logs.

```js
module.exports = async ({ sdk }) => {
  sdk.logEvent("Hello from Applications!");
};
```

**Runs Menu**

Each run of a hook has an overall result (sucess, failure, etc.) as well as logs attached to each run. These logs contain the `logEvent` messages.

![Runs Menu Screenshot][runs-menu-screenshot]

**Time Series**

The Time Series tab can be used to track points and variables over time. This is helpful for debugging purposes and validation purposes.

![Time Series Screenshot][time-series-screenshot]

## Reference

For more information and examples on how to use the Normal Application Framework, please refer to the [Documentation](https://docs.normal.dev/applications/overview/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[dashboard-screenshot]: images/dashboard.png
[classnames-screenshot]: images/classnames.png
[point-selection-screenshot]: images/point-selection.png
[install-screenshot]: images/install.png
[runs-menu-screenshot]: images/runs-menu.png
[time-series-screenshot]: images/time-series.png
