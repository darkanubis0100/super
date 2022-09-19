import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from 'FontAwesomeUtils'
import {
  faEllipsis,
  faHardDrive,
  faListAlt
} from '@fortawesome/free-solid-svg-icons'
import {
  Badge,
  FlatList,
  Heading,
  IconButton,
  HStack,
  Menu,
  Modal,
  Stack,
  Text,
  VStack,
  useDisclose,
  useColorModeValue
} from 'native-base'
import { api } from 'api'
import { AlertContext } from 'AppContext'
import { ucFirst } from 'utils'

const niceName = (name) => {
  if (Array.isArray(name)) {
    name = name[0]
  }

  return name.replace(/^\//, '')
}

const stateColor = (state) => {
  let stateColors = {
    running: 'success',
    exited: 'warning'
  }
  return stateColors[state] || 'muted'
}

const renderDockerContainer = ({ item, navigate, showModal }) => {
  let containerName = niceName(item.Names)

  const onRestart = () => {}
  const onMounts = () => {
    showModal(
      `${containerName} Volume Mounts`,
      <FlatList
        data={item.Mounts}
        keyExtractor={(item) => item.Source}
        renderItem={({ item: mount }) => (
          <HStack space={2} p={4} justifyContent="space-around">
            {/*<Text>{mount.Type}</Text>*/}
            <Text flex={1}>{mount.Source}</Text>
            <Text flex={1} color="muted.500">
              {mount.Destination}
            </Text>
            <Badge ml="auto" colorScheme="muted" variant="outline">
              {mount.Mode}
            </Badge>
          </HStack>
        )}
      />
    )
  }

  const onLogs = () => {
    navigate(`/admin/logs/${containerName}`)
  }

  const trigger = (triggerProps) => (
    <IconButton
      variant="unstyled"
      ml="auto"
      icon={<Icon icon={faEllipsis} color="muted.600" />}
      {...triggerProps}
    ></IconButton>
  )

  const moreMenu = (
    <Menu
      flex={1}
      w={190}
      closeOnSelect={true}
      trigger={trigger}
      alignSelf="center"
    >
      <Menu.Group title="View more ...">
        <Menu.Item onPress={onMounts}>
          <HStack space={2} alignItems="center">
            {<Icon icon={faHardDrive} color="muted.500" />}
            <Text>Mounts</Text>
          </HStack>
        </Menu.Item>
        <Menu.Item onPress={onLogs}>
          <HStack space={2} alignItems="center">
            <Icon icon={faListAlt} color="muted.500" />
            <Text>Logs</Text>
          </HStack>
        </Menu.Item>
      </Menu.Group>
      {/*
      <Menu.Group title="Actions">
        <Menu.Item onPress={onRestart}>Restart</Menu.Item>
      </Menu.Group>
       */}
    </Menu>
  )

  return (
    <HStack
      space={2}
      p={4}
      borderBottomColor="borderColorCardLight"
      _dark={{ borderBottomColor: 'borderColorCardDark' }}
      borderBottomWidth={1}
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
    >
      <Text flex={1}>{containerName}</Text>

      <Text flex={1} color="muted.500" isTruncated>
        {item.Image}
      </Text>
      <Badge ml="auto" colorScheme={stateColor(item.State)} variant="outline">
        {item.State}
      </Badge>
      <Text
        display={{ base: 'none', md: 'flex' }}
        minW="200px"
        ml="auto"
        textAlign="right"
        fontSize="xs"
        color="muted.500"
      >
        {item.Status}
      </Text>
      {moreMenu}
    </HStack>
  )
}

const SystemInfo = (props) => {
  const context = useContext(AlertContext)
  const navigate = useNavigate()

  const [containers, setContainers] = useState([])
  const [uptime, setUptime] = useState({})
  const [hostname, setHostname] = useState('')
  const [version, setVersion] = useState('')

  useEffect(() => {
    const fetchInfo = () => {
      api
        .get('/info/uptime')
        .then(setUptime)
        .catch((err) => context.error(err))

      api
        .get('/info/docker')
        .then(setContainers)
        .catch((err) => context.error(err))

      api
        .get('/info/hostname')
        .then(setHostname)
        .catch((err) => context.error(err))

      api
        .get('/version')
        .then(setVersion)
        .catch((err) => context.error(err))
    }

    fetchInfo()

    //NOTE Time will only update every x sec.
    const interval = setInterval(fetchInfo, 5 * 1e3)
    return () => clearInterval(interval)
  }, [])

  const niceKey = (key) => ucFirst(key.replace(/_/, ' ').replace(/m$/, ' min'))

  const { isOpen, onOpen, onClose } = useDisclose()

  const [modalTitle, setModalTitle] = useState('Container')
  const [modalBody, setModalBody] = useState('')

  const showModal = (title, content) => {
    setModalTitle(title)
    setModalBody(content)
    onOpen()
  }

  return (
    <>
      <HStack space={2} alignItems="flex-end" p={4}>
        <Heading fontSize="md">System Info</Heading>
      </HStack>

      <HStack space={4} mb={4}>
        <HStack
          flex={1}
          space={2}
          p={4}
          bg={useColorModeValue('backgroundCardLight', 'backgroundCardDark')}
          justifyContent="space-between"
        >
          <Text>Hostname</Text>
          <Text color="muted.500">{hostname}</Text>
        </HStack>
        <HStack
          flex={1}
          space={2}
          p={4}
          bg={useColorModeValue('backgroundCardLight', 'backgroundCardDark')}
          justifyContent="space-between"
        >
          <Text>SPR Version</Text>
          <Text color="muted.500">{version}</Text>
        </HStack>
      </HStack>

      <Stack direction={{ base: 'column', md: 'row' }} space={4} mb={4}>
        <FlatList
          flex={1}
          bg={useColorModeValue('backgroundCardLight', 'backgroundCardDark')}
          _rounded="md"
          data={['time', 'uptime', 'users']}
          keyExtractor={(item, index) => index}
          renderItem={({ item }) => (
            <HStack
              space={2}
              p={4}
              borderBottomColor="borderColorCardLight"
              _dark={{ borderBottomColor: 'borderColorCardDark' }}
              borderBottomWidth={1}
              justifyContent="space-between"
            >
              <Text>{niceKey(item)}</Text>
              <Text color="muted.500">{uptime[item]}</Text>
            </HStack>
          )}
        />
        <FlatList
          flex={1}
          bg={useColorModeValue('backgroundCardLight', 'backgroundCardDark')}
          _rounded="md"
          data={['load_1m', 'load_5m', 'load_15m']}
          keyExtractor={(item, index) => index}
          renderItem={({ item }) => (
            <HStack
              space={2}
              p={4}
              borderBottomColor="borderColorCardLight"
              _dark={{ borderBottomColor: 'borderColorCardDark' }}
              borderBottomWidth={1}
              justifyContent="space-between"
            >
              <Text>{niceKey(item)}</Text>
              <Text color="muted.500">{uptime[item]}</Text>
            </HStack>
          )}
        />
      </Stack>

      <Heading fontSize="md" p={4}>
        Docker Containers
      </Heading>
      <FlatList
        bg={useColorModeValue('backgroundCardLight', 'backgroundCardDark')}
        _rounded="md"
        data={containers}
        keyExtractor={(item, index) => item.Id}
        renderItem={({ item }) =>
          renderDockerContainer({ item, navigate, showModal })
        }
      />
      <Modal isOpen={isOpen} onClose={onClose} animationPreset="slide">
        <Modal.Content maxWidth={{ base: '100%', md: '90%' }}>
          <Modal.CloseButton />
          <Modal.Header>{modalTitle}</Modal.Header>
          <Modal.Body>{modalBody}</Modal.Body>
          {/*<Modal.Footer />*/}
        </Modal.Content>
      </Modal>
    </>
  )
}

export default SystemInfo
